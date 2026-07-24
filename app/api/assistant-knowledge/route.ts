import { NextResponse } from "next/server"
import { getSupportDocs } from "@/lib/assistant-knowledge-loader"

/**
 * Retorna os documentos de apoio (pasta `conteudo-assistente/`) ja convertidos
 * em secoes pesquisaveis. O parsing fica centralizado em
 * `lib/assistant-knowledge-loader.ts`, que tambem alimenta o assistente com IA.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const documents = await getSupportDocs()
    return NextResponse.json({ documents })
  } catch (error) {
    console.error("[v0] Erro ao carregar base de conhecimento externa:", error)
    return NextResponse.json({ documents: [] }, { status: 200 })
  }
}
