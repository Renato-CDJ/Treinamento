"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus, ArrowRight, CheckCircle2 } from "lucide-react"
import type { ScriptStep } from "@/lib/types"
import { useState } from "react"
import { SafeHtml } from "@/components/safe-html"

interface AdminScriptPreviewProps {
  step: ScriptStep
  onEdit?: () => void
  onDelete?: () => void
  onAddButton?: () => void
}

export function AdminScriptPreview({ step, onEdit, onDelete, onAddButton }: AdminScriptPreviewProps) {
  const [selectedButton, setSelectedButton] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <Card className="relative shadow-lg border-2 border-primary/20">
        {/* Admin controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit} className="text-blue-600 hover:text-blue-700">
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir
          </Button>
        </div>

        <CardHeader className="pb-6 pt-6">
          <div className="space-y-2">
            <Badge variant="outline" className="mb-2">
              ID: {step.id}
            </Badge>
            <CardTitle className="text-3xl text-center font-bold">{step.title}</CardTitle>
            {step.tabulations && step.tabulations.length > 0 && (
              <div className="flex flex-col items-center gap-2 mt-3">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-semibold">
                    Tabulaç{step.tabulations.length === 1 ? "ão" : "ões"} Recomendada
                    {step.tabulations.length > 1 ? "s" : ""}:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {step.tabulations.map((tab, index) => (
                    <div
                      key={tab.id}
                      className="bg-slate-700 dark:bg-slate-800 border border-slate-600 dark:border-slate-700 rounded-lg p-3 max-w-md"
                    >
                      <p className="text-sm font-semibold text-white mb-1">{tab.name}</p>
                      {tab.description && (
                        <p className="text-xs text-slate-200 whitespace-pre-wrap">{tab.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          <SafeHtml
            html={step.content}
            className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl p-10 leading-relaxed min-h-[280px] border border-border/50 text-base"
          />

          {/* Button configuration section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-muted-foreground">Botões de Ação:</h4>
              <Button variant="outline" size="sm" onClick={onAddButton}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Botão
              </Button>
            </div>

            <div className="grid gap-3">
              {step.buttons
                .sort((a, b) => a.order - b.order)
                .map((button) => (
                  <div
                    key={button.id}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedButton === button.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedButton(button.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={button.primary ? "default" : "secondary"}>{button.label}</Badge>
                      {button.nextStepId && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ArrowRight className="h-4 w-4" />
                          <span>→ {button.nextStepId}</span>
                        </div>
                      )}
                      {!button.nextStepId && (
                        <Badge variant="destructive" className="text-xs">
                          FIM
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
