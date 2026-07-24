import "server-only"

import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import mammoth from "mammoth"
import { getAutoLoadScripts } from "@/lib/auto-load-scripts"

/**
 * Carrega e organiza TODO o conhecimento que o Assistente do Roteiro pode usar
 * para responder aos operadores:
 *
 *  1. Roteiros/scripts da pasta `data/scripts` (arquivos .json), separados por
 *     produto/marca (ex.: HABITACIONAL, CARTAO FASE 1, COMERCIAL...).
 *  2. Documentos de apoio da pasta `conteudo-assistente` (.docx/.md/.txt).
 *
 * Em cima disso, oferece um seletor que escolhe apenas os trechos mais
 * relevantes para a pergunta do operador, priorizando o produto em atendimento
 * e evitando misturar conteudo de outros produtos.
 */

export interface KnowledgeSection {
  id: string
  /** Produto/marca normalizado (ex.: "habitacional"). null = material geral. */
  product: string | null
  /** Rotulo legivel do produto/marca (ex.: "HABITACIONAL"). */
  productLabel: string | null
  title: string
  text: string
  origin: "roteiro" | "documento"
  fileName?: string
}

// ---------------------------------------------------------------------------
// Normalizacao / tokenizacao (leve, self-contained; sem depender do client).
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  "a","o","as","os","um","uma","de","do","da","dos","das","em","no","na","nos","nas","por","para","pra",
  "pro","com","sem","sob","sobre","ate","apos","entre","e","ou","mas","que","se","como","qual","quais",
  "quando","onde","quem","porque","pq","ao","aos","este","esta","isso","isto","seu","sua","eu","voce","vc",
  "ele","ela","nos","me","te","lhe","ser","estar","ter","tem","foi","sao","seja","ja","nao","sim","muito",
  "mais","menos","tambem","entao","assim","aqui","la","fazer","posso","devo","preciso","quero","favor","o",
  "meu","minha","dele","dela","cliente","atendimento",
])

function normalizeText(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function stem(token: string): string {
  let t = token
  if (t.length > 4) {
    t = t.replace(/(coes|cao|mente|mento|ndo|ivel|avel|acao|icao)$/, "").replace(/(s|es)$/, "")
  }
  if (t.length > 5) {
    t = t.replace(/(ar|er|ir)$/, "")
  }
  return t
}

function tokenize(text: string): string[] {
  const normalized = normalizeText(text)
  if (!normalized) return []
  return normalized
    .split(" ")
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w))
    .map(stem)
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// Roteiros (data/scripts)
// ---------------------------------------------------------------------------

function extractStepText(step: any): { title: string; text: string } {
  const title = String(step?.title || "").trim()
  const parts: string[] = []
  if (step?.body) parts.push(String(step.body).trim())
  if (Array.isArray(step?.buttons) && step.buttons.length > 0) {
    const labels = step.buttons.map((b: any) => String(b?.label || "").trim()).filter(Boolean)
    if (labels.length > 0) parts.push(`Opcoes/caminhos: ${labels.join(" | ")}`)
  }
  return { title, text: parts.filter(Boolean).join("\n") }
}

let scriptSectionsCache: KnowledgeSection[] | null = null

function loadScriptSections(): KnowledgeSection[] {
  if (scriptSectionsCache) return scriptSectionsCache

  const sections: KnowledgeSection[] = []
  const scripts = getAutoLoadScripts()

  scripts.forEach((script: any, scriptIdx: number) => {
    const marcas = script?.marcas
    if (!marcas || typeof marcas !== "object") return

    for (const marcaLabel of Object.keys(marcas)) {
      const marca = marcas[marcaLabel]
      if (!marca || typeof marca !== "object") continue
      const productLabel = marcaLabel.trim()
      const product = normalizeText(productLabel)

      for (const stepKey of Object.keys(marca)) {
        const step = marca[stepKey]
        if (!step || typeof step !== "object") continue
        const { title, text } = extractStepText(step)
        if (!title && !text) continue
        sections.push({
          id: `roteiro-${scriptIdx}-${product}-${stepKey}`,
          product,
          productLabel,
          title: title || stepKey,
          text,
          origin: "roteiro",
        })
      }
    }
  })

  scriptSectionsCache = sections
  return sections
}

// ---------------------------------------------------------------------------
// Documentos de apoio (conteudo-assistente)
// ---------------------------------------------------------------------------

const CONTENT_DIR = path.join(process.cwd(), "conteudo-assistente")
const SUPPORTED = new Set([".docx", ".md", ".txt", ".markdown"])
const MAX_CHUNK_CHARS = 900

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

interface RawSection {
  title: string
  body: string
}

function chunkPlainText(text: string, fallbackTitle: string): RawSection[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (paragraphs.length === 0) return []

  const sections: RawSection[] = []
  let buffer = ""
  const flush = () => {
    const body = buffer.trim()
    if (!body) return
    const firstLine = body.split("\n")[0].slice(0, 80)
    sections.push({ title: firstLine || fallbackTitle, body })
    buffer = ""
  }
  for (const p of paragraphs) {
    if (buffer.length + p.length > MAX_CHUNK_CHARS && buffer.length > 0) flush()
    buffer += (buffer ? "\n\n" : "") + p
  }
  flush()
  return sections
}

function splitHtmlIntoSections(html: string, fallbackTitle: string): RawSection[] {
  const sections: RawSection[] = []
  const matches: Array<{ index: number; length: number; title: string }> = []

  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi
  let m: RegExpExecArray | null
  while ((m = headingRegex.exec(html)) !== null) {
    matches.push({ index: m.index, length: m[0].length, title: htmlToText(m[2]).replace(/\n+/g, " ").trim() })
  }

  const boldParaRegex = /<p[^>]*>\s*<strong>([\s\S]*?)<\/strong>\s*<\/p>/gi
  while ((m = boldParaRegex.exec(html)) !== null) {
    const title = htmlToText(m[1]).replace(/\n+/g, " ").trim()
    if (title.length === 0 || title.length > 90) continue
    matches.push({ index: m.index, length: m[0].length, title })
  }

  matches.sort((a, b) => a.index - b.index)

  if (matches.length === 0) {
    return chunkPlainText(htmlToText(html), fallbackTitle)
  }

  const intro = htmlToText(html.slice(0, matches[0].index))
  if (intro.length > 0) sections.push({ title: fallbackTitle, body: intro })

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].length
    const end = i + 1 < matches.length ? matches[i + 1].index : html.length
    const body = htmlToText(html.slice(start, end))
    const title = matches[i].title || fallbackTitle
    if (body.length > 0 || title) sections.push({ title, body })
  }

  return sections
}

function splitMarkdownIntoSections(md: string, fallbackTitle: string): RawSection[] {
  const lines = md.split(/\r?\n/)
  const sections: RawSection[] = []
  let currentTitle = fallbackTitle
  let buffer: string[] = []
  let hasHeading = false

  const flush = () => {
    const body = buffer.join("\n").trim()
    if (body.length > 0 || currentTitle !== fallbackTitle) sections.push({ title: currentTitle, body })
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
  if (!hasHeading) return chunkPlainText(md, fallbackTitle)
  return sections.filter((s) => s.body.length > 0)
}

function fileTitle(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim()
}

/** Infere o produto de um documento de apoio pelo nome do arquivo. */
function inferDocProduct(fileName: string): { product: string | null; productLabel: string | null } {
  const n = normalizeText(fileName)
  if (/\bcartao\b|cartoes|credito/.test(n)) return { product: "cartao", productLabel: "Cartao de Credito" }
  if (/habitacional|habitacao|imovel/.test(n)) return { product: "habitacional", productLabel: "Habitacional" }
  if (/comercial/.test(n)) return { product: "comercial", productLabel: "Comercial" }
  // Materiais gerais (Canais, Situacoes, Tabulacoes, Contratos, Procedimentos...) aplicam-se a todos.
  return { product: null, productLabel: null }
}

let docSectionsCache: KnowledgeSection[] | null = null

async function loadDocSections(): Promise<KnowledgeSection[]> {
  if (docSectionsCache) return docSectionsCache

  let entries: string[]
  try {
    entries = await readdir(CONTENT_DIR)
  } catch {
    docSectionsCache = []
    return []
  }

  const sections: KnowledgeSection[] = []

  for (const fileName of entries) {
    if (fileName.startsWith("~$") || fileName.startsWith(".")) continue
    if (fileName.toLowerCase() === "readme.md") continue
    const ext = path.extname(fileName).toLowerCase()
    if (!SUPPORTED.has(ext)) continue

    const fullPath = path.join(CONTENT_DIR, fileName)
    const baseTitle = fileTitle(fileName)
    const { product, productLabel } = inferDocProduct(fileName)

    try {
      let raw: RawSection[] = []
      if (ext === ".docx") {
        const buffer = await readFile(fullPath)
        const { value: html } = await mammoth.convertToHtml({ buffer })
        raw = splitHtmlIntoSections(html, baseTitle)
      } else {
        const content = await readFile(fullPath, "utf-8")
        raw = splitMarkdownIntoSections(content, baseTitle)
      }

      raw.forEach((section, idx) => {
        const title = section.title?.trim() || baseTitle
        const text = section.body?.trim() || ""
        if (!title && !text) return
        sections.push({
          id: `documento-${fileName}-${idx}`,
          product,
          productLabel,
          title,
          text,
          origin: "documento",
          fileName,
        })
      })
    } catch (error) {
      console.error(`[v0] Falha ao ler documento "${fileName}":`, error)
    }
  }

  docSectionsCache = sections
  return sections
}

// ---------------------------------------------------------------------------
// Selecao de contexto relevante
// ---------------------------------------------------------------------------

/** Verifica se o produto em atendimento corresponde ao produto da secao. */
function productMatches(productName: string, sectionProduct: string | null): boolean {
  if (!sectionProduct) return false
  const q = new Set(normalizeText(productName).split(" ").filter((w) => w.length >= 3))
  const s = new Set(sectionProduct.split(" ").filter((w) => w.length >= 3))
  if (q.size === 0 || s.size === 0) return false
  if (sectionProduct.includes(normalizeText(productName)) || normalizeText(productName).includes(sectionProduct)) {
    return true
  }
  let shared = 0
  for (const t of q) if (s.has(t)) shared++
  return shared >= 1
}

export interface SelectedContext {
  contextText: string
  usedSections: KnowledgeSection[]
  productLabelInScope: string | null
}

/**
 * Escolhe os trechos mais relevantes para a pergunta, priorizando o produto em
 * atendimento e penalizando conteudo de outros produtos.
 */
export async function selectRelevantContext(
  question: string,
  productName: string,
  { maxSections = 16, maxChars = 9000 }: { maxSections?: number; maxChars?: number } = {},
): Promise<SelectedContext> {
  const [scriptSections, docSections] = [loadScriptSections(), await loadDocSections()]
  const all = [...scriptSections, ...docSections]

  const qTokens = tokenize(question)
  const qNorm = normalizeText(question)

  // Descobre se o produto em atendimento existe na base (para so penalizar
  // "outro produto" quando ha, de fato, um produto correspondente).
  const hasProductInScope = all.some((s) => productMatches(productName, s.product))
  let productLabelInScope: string | null = null
  if (hasProductInScope) {
    const match = all.find((s) => productMatches(productName, s.product))
    productLabelInScope = match?.productLabel ?? null
  }

  const scored = all
    .map((section) => {
      const titleTokens = tokenize(section.title)
      const textTokens = tokenize(section.text)
      const titleSet = new Set(titleTokens)
      const textNorm = normalizeText(`${section.title} ${section.text}`)

      let score = 0
      for (const t of qTokens) {
        if (titleSet.has(t)) score += 4
        const count = textTokens.filter((x) => x === t).length
        if (count > 0) score += Math.min(count, 5)
        else if (t.length >= 4 && textNorm.includes(t)) score += 0.5
      }

      // Bonus: pergunta aparece quase literal no trecho.
      if (qNorm.length >= 8 && textNorm.includes(qNorm)) score += 6

      if (score <= 0) return { section, score: 0 }

      // Prioriza produto em atendimento; penaliza outros produtos.
      if (hasProductInScope) {
        if (productMatches(productName, section.product)) score *= 2.4
        else if (section.product === null) score *= 1.1
        else score *= 0.4
      }

      return { section, score }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)

  const used: KnowledgeSection[] = []
  const chunks: string[] = []
  let total = 0

  for (const { section } of scored) {
    if (used.length >= maxSections) break
    const header = section.productLabel ? `[${section.productLabel}] ${section.title}` : section.title
    const block = `### ${header}\n${section.text}`.trim()
    if (total + block.length > maxChars && used.length > 0) continue
    used.push(section)
    chunks.push(block)
    total += block.length
  }

  return {
    contextText: chunks.join("\n\n"),
    usedSections: used,
    productLabelInScope,
  }
}

/** Exposto para a rota /api/assistant-knowledge (compatibilidade). */
export async function getSupportDocs() {
  const docs = await loadDocSections()
  return docs.map((d) => ({ id: d.id, title: d.title, body: d.text, fileName: d.fileName ?? "" }))
}
