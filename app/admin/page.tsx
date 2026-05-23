"use client"

import { useState, lazy, Suspense, memo } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Sparkles } from "lucide-react"

const ScriptsTab = lazy(() => import("@/components/admin-tabs/scripts-tab").then((m) => ({ default: m.ScriptsTab })))
const ScriptLibraryTab = lazy(() => import("@/components/admin-tabs/script-library-tab").then((m) => ({ default: m.ScriptLibraryTab })))
const ProductsTab = lazy(() => import("@/components/admin-tabs/products-tab").then((m) => ({ default: m.ProductsTab })))
const AttendanceTypesTab = lazy(() =>
  import("@/components/admin-tabs/attendance-types-tab").then((m) => ({ default: m.AttendanceTypesTab })),
)
const OperatorsTab = lazy(() =>
  import("@/components/admin-tabs/operators-tab").then((m) => ({ default: m.OperatorsTab })),
)
const TabulationsTab = lazy(() =>
  import("@/components/admin-tabs/tabulations-tab").then((m) => ({ default: m.TabulationsTab })),
)
const TabulationMappingTab = lazy(() =>
  import("@/components/admin-tabs/tabulation-mapping-tab").then((m) => ({ default: m.TabulationMappingTab })),
)
const SituationsTab = lazy(() =>
  import("@/components/admin-tabs/situations-tab").then((m) => ({ default: m.SituationsTab })),
)
const ChannelsTab = lazy(() => import("@/components/admin-tabs/channels-tab").then((m) => ({ default: m.ChannelsTab })))
const WordCloudTab = lazy(() => import("@/components/admin-tabs/word-cloud-tab").then((m) => ({ default: m.WordCloudTab })))
const MessagesQuizTab = lazy(() =>
  import("@/components/admin-tabs/messages-quiz-tab").then((m) => ({ default: m.MessagesQuizTab })),
)
const SettingsPage = lazy(() => import("@/app/admin/settings/page"))
const AccessControlTab = lazy(() =>
  import("@/components/admin-tabs/access-control-tab").then((m) => ({ default: m.AccessControlTab })),
)
const PresentationsTab = lazy(() =>
  import("@/components/admin-tabs/presentations-tab").then((m) => ({ default: m.PresentationsTab })),
)
const InitialGuideTab = lazy(() =>
  import("@/components/admin-tabs/initial-guide-tab").then((m) => ({ default: m.InitialGuideTab })),
)
const FeedbackTab = lazy(() => import("@/components/admin-tabs/feedback-tab").then((m) => ({ default: m.FeedbackTab })))
const QualityQuestionsTab = lazy(() => import("@/components/admin-tabs/quality-questions-tab").then((m) => ({ default: m.QualityQuestionsTab })))
const ResultCodesTab = lazy(() => import("@/components/admin-tabs/result-codes-tab").then((m) => ({ default: m.ResultCodesTab })))
const SupervisorOperatorView = lazy(() => import("@/components/admin-tabs/supervisor-operator-view").then((m) => ({ default: m.SupervisorOperatorView })))
const CampaignsTab = lazy(() => import("@/components/admin-tabs/campaigns-tab").then((m) => ({ default: m.CampaignsTab })))


const LoadingFallback = memo(function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" />
          <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Sparkles className="h-6 w-6 text-white animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-foreground">Carregando</p>
          <p className="text-xs text-muted-foreground">Aguarde um momento...</p>
        </div>
      </div>
    </div>
  )
})

const AdminContent = memo(function AdminContent() {
  const { logout, user } = useAuth()
  // Set default tab based on admin type - supervisao users see operator-view by default
  const [activeTab, setActiveTab] = useState(() => {
    return user?.adminType === "supervisao" ? "operator-view" : "scripts"
  })
  const router = useRouter()

  const handleBack = () => {
    logout()
    router.push("/")
  }

  const renderContent = () => {
    switch (activeTab) {
      case "scripts":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ScriptsTab />
          </Suspense>
        )
      case "script-library":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ScriptLibraryTab />
          </Suspense>
        )
      case "products":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ProductsTab />
          </Suspense>
        )
      case "campaigns":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <CampaignsTab />
          </Suspense>
        )
      case "attendance-config":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AttendanceTypesTab />
          </Suspense>
        )
      case "operators":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <OperatorsTab />
          </Suspense>
        )
      case "tabulations":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <TabulationsTab />
          </Suspense>
        )
      case "tabulation-mapping":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <TabulationMappingTab />
          </Suspense>
        )
      case "situations":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SituationsTab />
          </Suspense>
        )
      case "channels":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ChannelsTab />
          </Suspense>
        )
      case "word-cloud":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <WordCloudTab />
          </Suspense>
        )
      case "messages-quiz":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <MessagesQuizTab />
          </Suspense>
        )
      case "feedback":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FeedbackTab />
          </Suspense>
        )
      case "settings":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SettingsPage />
          </Suspense>
        )
      case "access-control":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AccessControlTab />
          </Suspense>
        )
      case "presentations":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <PresentationsTab />
          </Suspense>
        )
      case "initial-guide":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <InitialGuideTab />
          </Suspense>
        )
      case "quality-questions":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <QualityQuestionsTab />
          </Suspense>
        )
      case "result-codes":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ResultCodesTab />
          </Suspense>
        )
      case "operator-view":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SupervisorOperatorView />
          </Suspense>
        )
      default:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ScriptsTab />
          </Suspense>
        )
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-screen h-dvh bg-gradient-to-br from-background via-background to-muted/30 overflow-x-hidden overflow-y-auto">
      {/* Sidebar */}
      <aside className="w-full md:w-72 flex-shrink-0 border-b md:border-b-0 md:border-r border-border/60 max-h-[40vh] md:max-h-none overflow-auto bg-card/50 backdrop-blur-sm shadow-sm">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-h-0 w-full">
        <div className="w-full max-w-full">
          {/* Content Area */}
          <div className="px-4 md:px-6 lg:px-8 py-6 md:py-8">
            {renderContent()}
          </div>
        </div>
      </main>

      <Toaster />
    </div>
  )
})

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminContent />
    </ProtectedRoute>
  )
}
