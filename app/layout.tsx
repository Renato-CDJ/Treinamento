import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"
import { InitializeStorage } from "@/components/initialize-storage-client"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Sistema de Roteiro de Atendimento",
  description: "Sistema profissional para gerenciamento de scripts de call center",
  generator: "v0.app",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark antialiased" suppressHydrationWarning>
      <body className={`font-sans ${geistSans.variable} ${geistMono.variable} relative`}>
        {/* Background estatico para melhor performance */}
        <div className="fixed inset-0 -z-10 dark:block hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800" />

        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="roteiro-theme" disableTransitionOnChange>
          <InitializeStorage />
          <Suspense fallback={null}>
            <AuthProvider>{children}</AuthProvider>
          </Suspense>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
