import { NextResponse } from "next/server"
import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import mammoth from "mammoth"

/**
 * Le os documentos de apoio colocados na pasta `conteudo-assistente/` e os
 * transforma em secoes pesquisaveis para o Assistente do Roteiro.
 *
 * Suporta .docx (Word), .md (Markdown) e .txt (texto simples). Cada titulo
 * dentro do documento vira uma secao independente (mais precisao na busca).
 */

export const dynamic = "force-dynamic"

const CONTENT_DIR = path.join(process.cwd(), "conteudo-assistente")
const SUPPORTED = new Set([".docx", ".md", ".txt", ".markdown"])
const MAX_CHUNK_CHARS = 900

export interface ExternalKnowledgeDoc {
  id: string
  title: string
  body: string
  fileName: string
}

/** Converte HTML (gerado pelo mammoth) em texto limpo, preservando quebras. */
function htmlToText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|li|h[1-6]|div|tr)\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

interface Section {
  title: string
  body: string
}

/**
 * Divide o HTML de um documento em secoes usando os titulos (h1-h6). Caso o
 * documento nao tenha titulos, o texto e agrupado em blocos por tamanho.
 */
function splitHtmlIntoSections(html: string, fallbackTitle: string): Section[] {
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi
  const sections: Section[] = []

  const matches: Array<{ index: number; length: number; title: string }> = []
  let m: RegExpExecArray | null
  while ((m = headingRegex.exec(html)) !== null) {
    matches.push({
      index: m.index,
      length: m[0].length,
      title: htmlToText(m[2]).replace(/\n+/g, " ").trim(),
    })
  }

  if (matches.length === 0) {
    // Sem titulos: agrupa paragrafos em blocos de tamanho controlado.
    const text = htmlToText(html)
    return chunkPlainText(text, fallbackTitle)
  }

  // Texto antes do primeiro titulo (introducao).
  const intro = htmlToText(html.slice(0, matches[0].index))
  if (intro.length > 0) {
    sections.push({ title: fallbackTitle, body: intro })
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].length
    const end = i + 1 < matches.length ? matches[i + 1].index : html.length
    const body = htmlToText(html.slice(start, end))
    const title = matches[i].title || fallbackTitle
    if (body.length > 0 || title) {
      sections.push({ title, body })
    }
  }

  return sections
}

/** Divide texto simples em blocos por paragrafos, respeitando um tamanho maximo. */
function chunkPlainText(text: string, fallbackTitle: string): Section[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) return []

  const sections: Section[] = []
  let buffer = ""

  const flush = () => {
    const body = buffer.trim()
    if (!body) return
    // Usa a primeira linha como titulo curto.
    const firstLine = body.split("\n")[0].slice(0, 80)
    sections.push({ title: firstLine || fallbackTitle, body })
    buffer = ""
  }

  for (const p of paragraphs) {
    if (buffer.length + p.length > MAX_CHUNK_CHARS && buffer.length > 0) {
      flush()
    }
    buffer += (buffer ? "\n\n" : "") + p
  }
  flush()

  return sections
}

/** Converte Markdown/texto em secoes usando os cabecalhos (#). */
function splitMarkdownIntoSections(md: string, fallbackTitle: string): Section[] {
  const lines = md.split(/\r?\n/)
  const sections: Section[] = []
  let currentTitle = fallbackTitle
  let buffer: string[] = []
  let hasHeading = false

  const flush = () => {
    const body = buffer.join("\n").trim()
    if (body.length > 0 || currentTitle !== fallbackTitle) {
      sections.push({ title: currentTitle, body })
    }
    buffer = []
  }

  for (const line of lines) {
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      flush()
      currentTitle = heading[2].trim() || fallbackTitle
      hasHeading = true
    } else {
      buffer.push(line)
    }
  }
  flush()

  if (!hasHeading) {
    return chunkPlainText(md, fallbackTitle)
  }

  return sections.filter((s) => s.body.length > 0)
}

function fileTitle(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim()
}

async function loadDocuments(): Promise<ExternalKnowledgeDoc[]> {
  let entries: string[]
  try {
    entries = await readdir(CONTENT_DIR)
  } catch {
    // Pasta ainda nao existe ou esta vazia.
    return []
  }

  const docs: ExternalKnowledgeDoc[] = []

  for (const fileName of entries) {
    // Ignora temporarios do Word, README e ocultos.
    if (fileName.startsWith("~$") || fileName.startsWith(".")) continue
    if (fileName.toLowerCase() === "readme.md") continue

    const ext = path.extname(fileName).toLowerCase()
    if (!SUPPORTED.has(ext)) continue

    const fullPath = path.join(CONTENT_DIR, fileName)
    const baseTitle = fileTitle(fileName)

    try {
      let sections: Section[] = []

      if (ext === ".docx") {
        const buffer = await readFile(fullPath)
        const { value: html } = await mammoth.convertToHtml({ buffer })
        sections = splitHtmlIntoSections(html, baseTitle)
      } else {
        const raw = await readFile(fullPath, "utf-8")
        sections = splitMarkdownIntoSections(raw, baseTitle)
      }

      sections.forEach((section, idx) => {
        const title = section.title?.trim() || baseTitle
        const body = section.body?.trim() || ""
        if (!title && !body) return
        docs.push({
          id: `documento-${fileName}-${idx}`,
          title,
          body,
          fileName,
        })
      })
    } catch (error) {
      console.error(`[v0] Falha ao ler documento "${fileName}":`, error)
    }
  }

  return docs
}

export async function GET() {
  try {
    const documents = await loadDocuments()
    return NextResponse.json({ documents })
  } catch (error) {
    console.error("[v0] Erro ao carregar base de conhecimento externa:", error)
    return NextResponse.json({ documents: [] }, { status: 200 })
  }
}
