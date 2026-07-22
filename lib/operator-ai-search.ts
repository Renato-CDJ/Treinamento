/**
 * Motor de busca inteligente local para o Assistente do Operador.
 *
 * Nao usa IA externa nem consome banco de dados: interpreta a pergunta do
 * operador e busca a resposta dentro de todos os dados ja disponiveis em cache
 * (scripts/roteiro do produto atual, situacoes de atendimento, tabulacoes,
 * canais e codigos de resultado, guia inicial e fraseologia).
 *
 * Se nao encontrar uma resposta com confianca suficiente, sinaliza para o
 * operador buscar ajuda de um especialista.
 */

import {
  getCachedSituations,
  getCachedTabulations,
  getCachedChannels,
  getCachedResultCodes,
  getCachedInitialGuide,
  getCachedPhraseology,
} from "@/lib/cache-service"
import type { ScriptStep } from "@/lib/types"

export type KnowledgeCategory =
  | "roteiro"
  | "situacao"
  | "tabulacao"
  | "canal"
  | "codigo"
  | "guia"
  | "fraseologia"

export interface KnowledgeDoc {
  id: string
  category: KnowledgeCategory
  categoryLabel: string
  title: string
  body: string
  /** Texto normalizado do titulo (peso maior na busca). */
  titleTokens: string[]
  /** Texto normalizado do corpo. */
  bodyTokens: string[]
}

export interface SearchResult {
  doc: KnowledgeDoc
  score: number
  /** Fracao dos termos da pergunta que foram encontrados (0 a 1). */
  coverage: number
}

const CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  roteiro: "Roteiro",
  situacao: "Situacao de Atendimento",
  tabulacao: "Tabulacao",
  canal: "Canal",
  codigo: "Codigo de Resultado",
  guia: "Guia Inicial",
  fraseologia: "Fraseologia",
}

// Stopwords comuns em portugues que nao ajudam a diferenciar documentos.
const STOPWORDS = new Set([
  "a","o","as","os","um","uma","uns","umas","de","do","da","dos","das","em","no","na","nos","nas",
  "por","para","pra","pro","com","sem","sob","sobre","ate","apos","ante","entre","e","ou","mas","que",
  "se","como","qual","quais","quando","onde","quem","porque","por que","pq","ao","aos","à","às","este",
  "esta","estes","estas","isso","isto","aquele","aquela","seu","sua","seus","suas","meu","minha","eu",
  "voce","vc","ele","ela","eles","elas","nos","vos","lhe","me","te","é","ser","estar","ter","tem","foi",
  "sao","seja","ja","nao","sim","muito","mais","menos","tambem","entao","assim","aqui","ali","la","fazer",
  "faco","posso","devo","preciso","quero","gostaria","favor","poderia","tem","haver","ha","dele","dela",
])

/** Remove acentos e normaliza para minusculas. */
export function normalizeText(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Radical simples para portugues (remove plurais e sufixos comuns). */
function stem(token: string): string {
  let t = token
  if (t.length > 4) {
    t = t
      .replace(/(coes|cao|mente|mento|ndo|ivel|avel|acao|icao)$/, "")
      .replace(/(s|es)$/, "")
  }
  return t
}

/** Quebra o texto em tokens uteis (sem stopwords, com radical). */
export function tokenize(text: string): string[] {
  const normalized = normalizeText(text)
  if (!normalized) return []
  return normalized
    .split(" ")
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w))
    .map(stem)
    .filter(Boolean)
}

/** Remove tags HTML e normaliza espacos, mantendo o texto legivel. */
function stripHtml(html: string): string {
  if (!html) return ""
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
}

/** Extrai texto de contentSegments (formato do editor de scripts). */
function extractSegmentsText(segments: any): string {
  if (!Array.isArray(segments)) return ""
  return segments
    .map((s) => (s && typeof s.text === "string" ? s.text : ""))
    .filter(Boolean)
    .join(" ")
}

function makeDoc(
  id: string,
  category: KnowledgeCategory,
  title: string,
  body: string,
): KnowledgeDoc {
  const cleanTitle = (title || "").trim()
  const cleanBody = (body || "").trim()
  return {
    id,
    category,
    categoryLabel: CATEGORY_LABELS[category],
    title: cleanTitle || CATEGORY_LABELS[category],
    body: cleanBody,
    titleTokens: tokenize(cleanTitle),
    bodyTokens: tokenize(`${cleanTitle} ${cleanBody}`),
  }
}

/**
 * Monta a base de conhecimento a partir dos passos do roteiro do produto atual
 * e de todos os dados operacionais em cache.
 */
export function buildKnowledgeBase(scriptSteps: ScriptStep[] = []): KnowledgeDoc[] {
  const docs: KnowledgeDoc[] = []

  // 1. Scripts/roteiro do produto atual
  for (const step of scriptSteps) {
    const segmentsText = extractSegmentsText((step as any).contentSegments || (step as any).content_segments)
    const contentText = stripHtml(step.content || "")
    const tabText = Array.isArray(step.tabulations)
      ? step.tabulations.map((t) => `${t.name} ${t.description || ""}`).join(" ")
      : ""
    const alertText = step.alert?.message ? `Alerta: ${step.alert.message}` : ""
    const body = [contentText, segmentsText, tabText, alertText].filter(Boolean).join("\n\n")
    docs.push(makeDoc(`roteiro-${step.id}`, "roteiro", step.title || "Passo do roteiro", body))
  }

  // 2. Situacoes de atendimento
  for (const s of getCachedSituations()) {
    docs.push(makeDoc(`situacao-${s.id}`, "situacao", s.name, stripHtml(s.description || "")))
  }

  // 3. Tabulacoes
  for (const t of getCachedTabulations()) {
    docs.push(makeDoc(`tabulacao-${t.id}`, "tabulacao", t.name, stripHtml(t.description || "")))
  }

  // 4. Canais
  for (const c of getCachedChannels()) {
    const contact = c.contact ? `Contato: ${c.contact}` : ""
    docs.push(makeDoc(`canal-${c.id}`, "canal", c.name, contact))
  }

  // 5. Codigos de resultado
  for (const r of getCachedResultCodes()) {
    const phase =
      r.phase === "before"
        ? "Antes da identificacao positiva"
        : r.phase === "after"
          ? "Apos identificacao positiva"
          : ""
    const body = [stripHtml(r.description || ""), phase].filter(Boolean).join(" - ")
    docs.push(makeDoc(`codigo-${r.id}`, "codigo", r.name, body))
  }

  // 6. Guia inicial
  for (const g of getCachedInitialGuide()) {
    const title = g.title || g.name || "Guia Inicial"
    const body = stripHtml(g.content || g.description || "")
    docs.push(makeDoc(`guia-${g.id}`, "guia", title, body))
  }

  // 7. Fraseologia
  for (const f of getCachedPhraseology()) {
    const title = f.title || f.name || f.category || "Fraseologia"
    const body = stripHtml(f.content || f.description || f.text || "")
    docs.push(makeDoc(`fraseologia-${f.id}`, "fraseologia", title, body))
  }

  return docs.filter((d) => d.bodyTokens.length > 0 || d.titleTokens.length > 0)
}

/**
 * Interpreta a pergunta e busca os documentos mais relevantes.
 * Usa pontuacao por frequencia de termos com peso extra para o titulo,
 * bonus para casamento de frase e cobertura dos termos da pergunta.
 */
export function searchKnowledge(
  question: string,
  docs: KnowledgeDoc[],
  limit = 3,
): SearchResult[] {
  const queryTokens = tokenize(question)
  if (queryTokens.length === 0) return []

  const uniqueQuery = Array.from(new Set(queryTokens))
  const normalizedQuestion = normalizeText(question)

  const results: SearchResult[] = []

  for (const doc of docs) {
    const titleSet = new Set(doc.titleTokens)
    const bodySet = new Set(doc.bodyTokens)

    let score = 0
    let matched = 0

    for (const qt of uniqueQuery) {
      let hit = false
      // Peso maior quando o termo aparece no titulo
      if (titleSet.has(qt)) {
        score += 5
        hit = true
      }
      if (bodySet.has(qt)) {
        // conta ocorrencias no corpo (frequencia)
        const freq = doc.bodyTokens.filter((b) => b === qt).length
        score += 1.5 + Math.min(freq - 1, 4) * 0.5
        hit = true
      } else {
        // casamento parcial (prefixo) para termos maiores
        if (qt.length >= 4) {
          const partial = doc.bodyTokens.some((b) => b.startsWith(qt) || qt.startsWith(b))
          if (partial) {
            score += 0.6
            hit = true
          }
        }
      }
      if (hit) matched++
    }

    if (matched === 0) continue

    const coverage = matched / uniqueQuery.length

    // Bonus se a pergunta (ou boa parte dela) aparece como frase no corpo
    const docPhrase = normalizeText(`${doc.title} ${doc.body}`)
    if (normalizedQuestion.length >= 6 && docPhrase.includes(normalizedQuestion)) {
      score += 6
    }

    // Recompensa cobertura alta (respostas que cobrem quase todos os termos)
    score += coverage * 3

    results.push({ doc, score, coverage })
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, limit)
}

/**
 * Decide se o melhor resultado e confiavel o bastante para ser mostrado.
 * Caso contrario, o assistente deve orientar a buscar um especialista.
 */
export function isConfident(results: SearchResult[]): boolean {
  if (results.length === 0) return false
  const best = results[0]
  // Precisa de pontuacao minima E ter coberto pelo menos parte relevante da pergunta.
  return best.score >= 4 && best.coverage >= 0.34
}
