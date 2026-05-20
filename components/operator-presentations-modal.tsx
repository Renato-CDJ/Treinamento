"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  getActivePresentationsForOperator,
  getPresentationProgressByOperator,
  getFilePresentationProgressByFile,
} from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import { PresentationViewer } from "@/components/presentation-viewer"
import { PresentationSlideshowViewer } from "@/components/presentation-slideshow-viewer"
import type { Presentation } from "@/lib/types"
import { Play, CheckCircle2, GraduationCap } from "lucide-react"

interface OperatorPresentationsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface PPTFile {
  name: string
  path: string
  extension: string
  displayName: string
}

export function OperatorPresentationsModal({ isOpen, onClose }: OperatorPresentationsModalProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null)
  const [showViewer, setShowViewer] = useState(false)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [pptFiles, setPptFiles] = useState<PPTFile[]>([])
  const [selectedPPTFile, setSelectedPPTFile] = useState<PPTFile | null>(null)
  const [showSlideshowViewer, setShowSlideshowViewer] = useState(false)

  const loadData = useCallback(() => {
    if (user) {
      const activePresentations = getActivePresentationsForOperator(user.id)
      setPresentations(activePresentations)

      const progress = getPresentationProgressByOperator(user.id)
      const completed = new Set(progress.filter((p) => p.marked_as_seen).map((p) => p.presentationId))
      setCompletedIds(completed)
    }
  }, [user])

  const loadPPTFiles = useCallback(async () => {
    try {
      const response = await fetch("/api/presentations/files")
      const data = await response.json()
      setPptFiles(data.files || [])
    } catch (error) {
      console.error("[v0] Error loading files:", error)
      setPptFiles([])
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadData()
      loadPPTFiles()
    }
  }, [isOpen, loadData, loadPPTFiles])

  const openFile = (file: PPTFile) => {
    setSelectedPPTFile(file)
    setShowSlideshowViewer(true)
  }

  const getFileCompletionStatus = (fileName: string) => {
    if (!user) return false
    const fileProgress = getFilePresentationProgressByFile(fileName)
    return fileProgress.some((p) => p.operatorId === user.id && p.marked_as_seen)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="!max-w-[98vw] w-[98vw] !max-h-[90vh] h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="border-b px-6 py-4 flex-shrink-0">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-xl">
                <GraduationCap className="h-7 w-7 text-orange-500" />
              </div>
              Treinamentos
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Explore apresentações, PDFs e materiais de capacitação
            </p>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-auto">
            <div className="px-6 py-4">
              {pptFiles.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-foreground">Materiais de Treinamento</h3>
                    <Badge variant="secondary" className="text-base px-4 py-2">
                      {pptFiles.length} {pptFiles.length === 1 ? "arquivo" : "arquivos"}
                    </Badge>
                  </div>

                  <div className="space-y-4 max-w-full overflow-hidden">
                    {pptFiles.map((file) => {
                      const isCompleted = getFileCompletionStatus(file.displayName)

                      return (
                        <Card
                          key={file.name}
                          className="group relative overflow-hidden hover:shadow-xl transition-all duration-200 border-2 hover:border-orange-500/50"
                        >
                          <div className="p-6 flex items-center gap-6 max-w-full">
                            <div className="flex-shrink-0 p-4 bg-orange-500/10 rounded-xl">
                              <GraduationCap className="h-8 w-8 text-orange-500" />
                            </div>

                            <div className="flex-1 min-w-0 pr-4">
                              <h4 className="font-semibold text-xl mb-2 line-clamp-2 break-words">{file.displayName}</h4>
                              <div className="flex items-center gap-3 flex-wrap">
                                <Badge variant="outline" className="text-sm px-3 py-1">
                                  PowerPoint
                                </Badge>
                                {isCompleted ? (
                                  <Badge className="bg-green-600 text-white border-0 text-sm px-3 py-1">
                                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                    Concluído
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-sm px-3 py-1">
                                    Pendente
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              <Button
                                onClick={() => openFile(file)}
                                className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-6 text-base"
                                size="lg"
                              >
                                <Play className="h-5 w-5 mr-2" />
                                Abrir Apresentação
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              {presentations.length > 0 && (
                <div className="space-y-6 mt-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-foreground">Apresentações Interativas</h3>
                    <Badge variant="secondary" className="text-base px-4 py-2">
                      {presentations.length} {presentations.length === 1 ? "apresentação" : "apresentações"}
                    </Badge>
                  </div>

                  <div className="space-y-4 max-w-full overflow-hidden">
                    {presentations.map((presentation) => {
                      const isCompleted = completedIds.has(presentation.id)

                      return (
                        <Card
                          key={presentation.id}
                          className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-500/50"
                        >
                          <div className="p-6 max-w-full">
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-xl mb-2 break-words">{presentation.title}</h4>
                                {presentation.description && (
                                  <p className="text-base text-muted-foreground line-clamp-2 break-words">
                                    {presentation.description}
                                  </p>
                                )}
                              </div>
                              {isCompleted && (
                                <Badge className="bg-green-600 text-white border-0 shadow-lg flex-shrink-0 px-3 py-1">
                                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                  Concluído
                                </Badge>
                              )}
                            </div>
                            <Button
                              onClick={() => {
                                setSelectedPresentation(presentation)
                                setShowViewer(true)
                              }}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-6 text-base"
                              size="lg"
                            >
                              <Play className="h-5 w-5 mr-2" />
                              {isCompleted ? "Revisar Apresentação" : "Iniciar Apresentação"}
                            </Button>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              {pptFiles.length === 0 && presentations.length === 0 && (
                <div className="py-20 text-center">
                  <div className="inline-flex p-6 bg-muted rounded-full mb-6">
                    <GraduationCap className="h-16 w-16 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">Nenhum treinamento disponível</h3>
                  <p className="text-base text-muted-foreground">Novos materiais serão adicionados em breve</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {selectedPresentation && (
        <PresentationViewer
          presentation={selectedPresentation}
          isOpen={showViewer}
          onClose={() => {
            setShowViewer(false)
            setSelectedPresentation(null)
            loadData()
          }}
        />
      )}

      {selectedPPTFile && (
        <PresentationSlideshowViewer
          isOpen={showSlideshowViewer}
          onClose={() => {
            setShowSlideshowViewer(false)
            setSelectedPPTFile(null)
            loadData()
            loadPPTFiles()
          }}
          fileName={selectedPPTFile.displayName}
          filePath={selectedPPTFile.path}
          isPDF={selectedPPTFile.extension === ".pdf"}
        />
      )}
    </>
  )
}
