"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Flag,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Link2,
  Move,
  MousePointer2,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface CanvasButton {
  id: string
  label: string
  next: string | null
  primary: boolean
}

export interface CanvasScreen {
  key: string
  title: string
  isStart: boolean
  buttons: CanvasButton[]
  alertMessage: string
}

export interface NodePosition {
  x: number
  y: number
}

interface ScriptFlowCanvasProps {
  screens: CanvasScreen[]
  positions: Record<string, NodePosition>
  selectedKey: string
  onSelect: (key: string) => void
  onMove: (key: string, pos: NodePosition) => void
  onConnect: (fromKey: string, btnId: string, toKey: string | null) => void
  onAddScreen: () => void
  onAddButton: (key: string) => void
  onSetStart: (key: string) => void
  onRemoveScreen: (key: string) => void
}

const NODE_WIDTH = 264
const HEADER_H = 48
const BODY_PAD_TOP = 10
const ROW_H = 34
const ROW_GAP = 8
const EMPTY_BODY_H = 44

// Vertical center of a button's output port, relative to node top
function portY(index: number) {
  return HEADER_H + BODY_PAD_TOP + index * (ROW_H + ROW_GAP) + ROW_H / 2
}

// Total node height (for input port centering on the left edge)
function nodeHeight(buttonCount: number) {
  if (buttonCount === 0) return HEADER_H + EMPTY_BODY_H
  return HEADER_H + BODY_PAD_TOP + buttonCount * (ROW_H + ROW_GAP) + 6
}

export function ScriptFlowCanvas({
  screens,
  positions,
  selectedKey,
  onSelect,
  onMove,
  onConnect,
  onAddScreen,
  onAddButton,
  onSetStart,
  onRemoveScreen,
}: ScriptFlowCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  // Interaction refs (avoid re-render churn during drags)
  const dragNode = useRef<{ key: string; offX: number; offY: number } | null>(null)
  const panning = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)
  const linking = useRef<{ fromKey: string; btnId: string } | null>(null)

  const [linkCursor, setLinkCursor] = useState<{ x: number; y: number } | null>(null)
  const [hoverTarget, setHoverTarget] = useState<string | null>(null)

  const toCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0 }
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      }
    },
    [pan, zoom],
  )

  // Global pointer handlers for dragging nodes, panning and linking
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (dragNode.current) {
        const c = toCanvas(e.clientX, e.clientY)
        onMove(dragNode.current.key, {
          x: Math.round(c.x - dragNode.current.offX),
          y: Math.round(c.y - dragNode.current.offY),
        })
        return
      }
      if (panning.current) {
        setPan({
          x: panning.current.originX + (e.clientX - panning.current.startX),
          y: panning.current.originY + (e.clientY - panning.current.startY),
        })
        return
      }
      if (linking.current) {
        const c = toCanvas(e.clientX, e.clientY)
        setLinkCursor(c)
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
        const nodeEl = el?.closest("[data-node-key]") as HTMLElement | null
        const targetKey = nodeEl?.getAttribute("data-node-key") || null
        setHoverTarget(targetKey && targetKey !== linking.current.fromKey ? targetKey : null)
      }
    }

    const handleUp = (e: MouseEvent) => {
      if (linking.current) {
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
        const nodeEl = el?.closest("[data-node-key]") as HTMLElement | null
        const targetKey = nodeEl?.getAttribute("data-node-key")
        if (targetKey && targetKey !== linking.current.fromKey) {
          onConnect(linking.current.fromKey, linking.current.btnId, targetKey)
        }
      }
      dragNode.current = null
      panning.current = null
      linking.current = null
      setLinkCursor(null)
      setHoverTarget(null)
    }

    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
  }, [toCanvas, onMove, onConnect])

  const startNodeDrag = (e: React.MouseEvent, key: string) => {
    e.stopPropagation()
    const pos = positions[key] || { x: 0, y: 0 }
    const c = toCanvas(e.clientX, e.clientY)
    dragNode.current = { key, offX: c.x - pos.x, offY: c.y - pos.y }
    onSelect(key)
  }

  const startPan = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    panning.current = { startX: e.clientX, startY: e.clientY, originX: pan.x, originY: pan.y }
  }

  const startLink = (e: React.MouseEvent, fromKey: string, btnId: string) => {
    e.stopPropagation()
    linking.current = { fromKey, btnId }
    setLinkCursor(toCanvas(e.clientX, e.clientY))
  }

  const fitView = () => {
    setPan({ x: 0, y: 0 })
    setZoom(1)
  }

  // Build connection segments
  const connections: {
    id: string
    fromKey: string
    btnId: string
    x1: number
    y1: number
    x2: number
    y2: number
  }[] = []
  screens.forEach((s) => {
    const from = positions[s.key]
    if (!from) return
    s.buttons.forEach((b, i) => {
      if (!b.next) return
      const to = positions[b.next]
      if (!to) return
      const targetButtons = screens.find((t) => t.key === b.next)?.buttons.length ?? 0
      connections.push({
        id: `${s.key}-${b.id}`,
        fromKey: s.key,
        btnId: b.id,
        x1: from.x + NODE_WIDTH,
        y1: from.y + portY(i),
        x2: to.x,
        y2: to.y + nodeHeight(targetButtons) / 2,
      })
    })
  })

  const pathFor = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.max(50, Math.abs(x2 - x1) / 2)
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
  }

  return (
    <div className="relative rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
      {/* Toolbar */}
      <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
        <Button
          size="sm"
          onClick={onAddScreen}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md shadow-orange-500/20"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Adicionar Tela
        </Button>
        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/90 backdrop-blur px-1 py-1 shadow-sm">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2)))} title="Diminuir zoom">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium text-muted-foreground w-10 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)))} title="Aumentar zoom">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fitView} title="Resetar visão">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hint */}
      <div className="absolute right-3 top-3 z-20 hidden sm:flex items-center gap-2 rounded-lg border border-border/60 bg-background/90 backdrop-blur px-3 py-1.5 shadow-sm">
        <Link2 className="h-3.5 w-3.5 text-orange-500" />
        <span className="text-[11px] text-muted-foreground">
          Arraste da bolinha de um botão até outra tela para conectar
        </span>
      </div>

      {/* Canvas viewport */}
      <div
        ref={containerRef}
        onMouseDown={startPan}
        className="relative h-[600px] w-full cursor-grab active:cursor-grabbing select-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, color-mix(in oklab, var(--border) 60%, transparent) 1px, transparent 1px)",
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          {/* Connections layer */}
          <svg
            className="absolute left-0 top-0 overflow-visible pointer-events-none"
            style={{ width: 1, height: 1 }}
          >
            <defs>
              <marker id="flow-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                <path d="M0,0 L8,3 L0,6 Z" className="fill-orange-500" />
              </marker>
            </defs>
            {connections.map((c) => (
              <g key={c.id} className="pointer-events-auto">
                <path
                  d={pathFor(c.x1, c.y1, c.x2, c.y2)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={16}
                  className="cursor-pointer"
                  onClick={() => onConnect(c.fromKey, c.btnId, null)}
                />
                <path
                  d={pathFor(c.x1, c.y1, c.x2, c.y2)}
                  fill="none"
                  className="stroke-orange-500 hover:stroke-red-500 transition-colors pointer-events-none"
                  strokeWidth={2}
                  markerEnd="url(#flow-arrow)"
                />
              </g>
            ))}
            {/* Live linking line */}
            {linking.current && linkCursor && (() => {
              const from = positions[linking.current.fromKey]
              const idx = screens
                .find((s) => s.key === linking.current!.fromKey)
                ?.buttons.findIndex((b) => b.id === linking.current!.btnId)
              if (!from || idx == null || idx < 0) return null
              const x1 = from.x + NODE_WIDTH
              const y1 = from.y + portY(idx)
              return (
                <path
                  d={pathFor(x1, y1, linkCursor.x, linkCursor.y)}
                  fill="none"
                  className="stroke-orange-400"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                />
              )
            })()}
          </svg>

          {/* Nodes layer */}
          {screens.map((screen) => {
            const pos = positions[screen.key] || { x: 0, y: 0 }
            const isSelected = screen.key === selectedKey
            const isHoverTarget = hoverTarget === screen.key
            return (
              <div
                key={screen.key}
                data-node-key={screen.key}
                className={cn(
                  "absolute rounded-xl border bg-card shadow-sm transition-shadow",
                  isSelected ? "border-orange-500 shadow-md ring-2 ring-orange-500/20" : "border-border/70",
                  isHoverTarget && "border-green-500 ring-2 ring-green-500/30",
                )}
                style={{ left: pos.x, top: pos.y, width: NODE_WIDTH }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => onSelect(screen.key)}
              >
                {/* Input port */}
                <div
                  className="absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-background bg-muted-foreground/50"
                  style={{ top: nodeHeight(screen.buttons.length) / 2 - 6 }}
                  title="Entrada"
                />

                {/* Header */}
                <div
                  onMouseDown={(e) => startNodeDrag(e, screen.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-t-xl px-3 cursor-move",
                    screen.isStart
                      ? "bg-gradient-to-r from-green-500/15 to-green-500/5"
                      : "bg-muted/50",
                  )}
                  style={{ height: HEADER_H }}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white",
                      screen.isStart ? "bg-green-500" : "bg-orange-500",
                    )}
                  >
                    {screen.isStart ? <Flag className="h-3 w-3" /> : screen.title.charAt(0).toUpperCase() || "T"}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                    {screen.title || "Sem título"}
                  </span>
                  <Move className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                </div>

                {/* Body: buttons */}
                <div className="px-3 pb-3" style={{ paddingTop: BODY_PAD_TOP }}>
                  {screen.buttons.length === 0 ? (
                    <div className="flex items-center justify-between gap-2" style={{ height: EMPTY_BODY_H - 10 }}>
                      <span className="text-xs text-muted-foreground">Sem botões</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-orange-600 hover:bg-orange-500/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddButton(screen.key)
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col" style={{ gap: ROW_GAP }}>
                      {screen.buttons.map((b) => (
                        <div
                          key={b.id}
                          className={cn(
                            "relative flex items-center rounded-md border px-2 text-xs font-medium",
                            b.primary
                              ? "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300"
                              : "border-border/60 bg-muted/40 text-foreground",
                          )}
                          style={{ height: ROW_H }}
                        >
                          <span className="min-w-0 flex-1 truncate">{b.label || "Botão"}</span>
                          {b.next ? (
                            <span className="ml-1 shrink-0 text-[10px] text-green-600 dark:text-green-400">●</span>
                          ) : (
                            <span className="ml-1 shrink-0 text-[10px] text-muted-foreground/50">○</span>
                          )}
                          {/* Output port */}
                          <button
                            type="button"
                            title="Arraste para conectar a outra tela"
                            onMouseDown={(e) => startLink(e, screen.key, b.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute -right-[18px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-orange-500 hover:scale-125 hover:bg-orange-600 transition-transform cursor-crosshair"
                            style={{ top: ROW_H / 2 - 8 }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty state */}
        {screens.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <MousePointer2 className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">Adicione uma tela para começar a desenhar o fluxo.</p>
          </div>
        )}
      </div>

      {/* Footer status */}
      <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-background/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {screens.length} {screens.length === 1 ? "tela" : "telas"}
          </Badge>
          <Badge variant="outline" className="border-orange-500/40 text-orange-600 dark:text-orange-400">
            {connections.length} {connections.length === 1 ? "conexão" : "conexões"}
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground hidden sm:inline">
          Clique numa linha para removê-la • Arraste o fundo para mover a tela
        </span>
      </div>
    </div>
  )
}
