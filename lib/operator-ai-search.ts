/**
 * Motor de busca inteligente local para o Assistente do Operador.
 *
 * Nao usa IA externa nem consome banco de dados: interpreta a pergunta do
 * operador e busca a resposta dentro de todos os dados ja disponiveis em cache
 * (scripts/roteiro do produto atual, situacoes de atendimento, tabulacoes,
 * canais e codigos de resultado, guia inicial e fraseologia).
 *
 * O ranqueamento usa TF-IDF: termos que aparecem em quase todos os documentos
 * (ex.: "cliente", "atendimento") recebem peso baixo, enquanto termos
 * distintivos (ex.: "desempregado", "pagar", "acordo") recebem peso alto. Assim
 * a resposta se baseia no conceito da pergunta, e nao em palavras genericas.
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
  | "documento"

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
  /** Fracao ponderada (IDF) dos termos distintivos da pergunta que foram encontrados (0 a 1). */
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
  documento: "Documento de Apoio",
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
  "disse","falou","informou","informa","cliente","atendimento","atender","dia","hoje","agora","momento",
])

/**
 * Grupos de sinonimos/conceitos do dominio de cobranca. Quando um termo da
 * pergunta pertence a um grupo, os demais termos do grupo sao adicionados como
 * termos de busca auxiliares (peso reduzido). Isso conecta a pergunta do
 * operador com a linguagem usada nas tabulacoes e no roteiro.
 * Os termos sao radicalizados no carregamento do modulo.
 */
const SYNONYM_GROUPS_RAW: string[][] = [
  // Desemprego / falta de renda
  ["desempregado", "desemprego", "desempregada", "sem emprego", "perdeu emprego", "demitido", "demitida", "demissao", "sem renda", "sem trabalho", "parado", "sem salario"],
  // Pagamento / quitacao
  ["pagar", "pagamento", "pagou", "quitar", "quitacao", "boleto", "fatura", "parcela", "valor", "divida", "debito"],
  // Dificuldade financeira / impossibilidade
  ["dificuldade", "dificil", "aperto", "apertado", "impossibilidade", "impossivel", "sem condicoes", "endividado", "endividada", "financeira", "financeiro", "grana", "dinheiro"],
  // Nao consegue / nao pode pagar
  ["nao consegue", "nao pode", "incapaz", "sem poder", "impossibilitado"],
  // Negociacao / acordo
  ["negociar", "negociacao", "acordo", "proposta", "parcelamento", "parcelar", "reparcelamento", "renegociar", "renegociacao", "entrada"],
  // Atraso / vencimento / inadimplencia
  ["atraso", "atrasado", "atrasada", "vencido", "vencida", "vencimento", "inadimplente", "inadimplencia", "atrasar"],
  // Prazo
  ["prazo", "prazos", "dias", "vencer", "adiar", "adiamento", "prorrogar", "prorrogacao"],
  // Contato / retorno
  ["contato", "retorno", "ligar", "ligacao", "telefone", "recado", "callback", "retornar"],
  // Recusa / desligou
  ["recusa", "recusou", "desligou", "desligar", "nao quer", "negou", "nega"],
  // Doenca / problemas de saude
  ["doente", "doenca", "saude", "internado", "hospital", "medico", "afastado", "afastamento"],
  // Falecimento
  ["falecido", "falecimento", "obito", "morreu", "faleceu"],
  // Nao reside / mudou / terceiro
  ["nao reside", "mudou", "endereco", "terceiro", "engano", "nao mora", "nao conhece"],
]

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

/** Mapa (stem -> conjunto de stems relacionados) montado a partir dos grupos de sinonimos. */
const SYNONYM_INDEX: Map<string, Set<string>> = (() => {
  const index = new Map<string, Set<string>>()
  for (const group of SYNONYM_GROUPS_RAW) {
    // Radicaliza todos os termos do grupo (frases viram varios stems).
    const stems = new Set<string>()
    for (const phrase of group) {
      for (const s of tokenize(phrase)) stems.add(s)
    }
    for (const s of stems) {
      const related = index.get(s) ?? new Set<string>()
      for (const other of stems) {
        if (other !== s) related.add(other)
      }
      index.set(s, related)
    }
  }
  return index
})()

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

/** Estrutura de um documento externo (vindo da pasta conteudo-assistente/). */
export interface ExternalKnowledgeDoc {
  id: string
  title: string
  body: string
  fileName?: string
}

/**
 * Converte os documentos de apoio (arquivos .docx/.md/.txt lidos pela rota
 * /api/assistant-knowledge) em documentos pesquisaveis e os adiciona a base
 * de conhecimento existente.
 */
export function addDocumentsToKnowledgeBase(
  base: KnowledgeDoc[],
  externalDocs: ExternalKnowledgeDoc[] = [],
): KnowledgeDoc[] {
  const extra: KnowledgeDoc[] = []
  for (const d of externalDocs) {
    const doc = makeDoc(d.id || `documento-${extra.length}`, "documento", d.title, d.body)
    if (doc.bodyTokens.length > 0 || doc.titleTokens.length > 0) {
      extra.push(doc)
    }
  }
  return [...base, ...extra]
}

/** Calcula o IDF de cada termo: termos raros pesam mais, termos comuns pesam menos. */
function computeIdf(docs: KnowledgeDoc[]): Map<string, number> {
  const df = new Map<string, number>()
  for (const doc of docs) {
    const seen = new Set(doc.bodyTokens)
    for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1)
  }
  const N = Math.max(docs.length, 1)
  const idf = new Map<string, number>()
  for (const [term, freq] of df) {
    // idf suavizado; sempre >= ~0.3 para termos muito comuns.
    idf.set(term, Math.log(1 + N / (freq + 0.5)) + 0.3)
  }
  return idf
}

/** Peso IDF de um termo (termos ausentes da base recebem peso alto: sao distintivos). */
function idfOf(term: string, idf: Map<string, number>, N: number): number {
  return idf.get(term) ?? Math.log(1 + N / 0.5) + 0.3
}

/**
 * Expande os termos da pergunta com sinonimos do dominio.
 * Retorna termos diretos (peso 1) e termos derivados de sinonimo (peso 0.5).
 */
function expandQuery(queryTokens: string[]): Array<{ term: string; weight: number }> {
  const direct = new Set(queryTokens)
  const terms = new Map<string, number>()
  for (const t of direct) terms.set(t, 1)
  for (const t of direct) {
    const related = SYNONYM_INDEX.get(t)
    if (related) {
      for (const r of related) {
        if (!terms.has(r)) terms.set(r, 0.5)
      }
    }
  }
  return Array.from(terms, ([term, weight]) => ({ term, weight }))
}

/** Deteccao simples de intencao pela categoria mencionada na pergunta. */
function detectCategoryIntent(normalizedQuestion: string): KnowledgeCategory | null {
  if (/\btabula/.test(normalizedQuestion)) return "tabulacao"
  if (/\b(situacao|situacoes)\b/.test(normalizedQuestion)) return "situacao"
  if (/\b(canal|canais|telefone|contato)\b/.test(normalizedQuestion)) return "canal"
  if (/\b(codigo|codigos|resultado)\b/.test(normalizedQuestion)) return "codigo"
  if (/\b(roteiro|script|passo|tela|texto)\b/.test(normalizedQuestion)) return "roteiro"
  if (/\b(frase|fraseologia|falar|dizer)\b/.test(normalizedQuestion)) return "fraseologia"
  if (/\b(documento|documentos|manual|material|materiais|apostila|politica|procedimento|norma)\b/.test(normalizedQuestion)) return "documento"
  return null
}

/**
 * Interpreta a pergunta e busca os documentos mais relevantes usando TF-IDF,
 * expansao de sinonimos, peso extra para titulo e cobertura ponderada por IDF.
 */
export function searchKnowledge(
  question: string,
  docs: KnowledgeDoc[],
  limit = 3,
): SearchResult[] {
  const queryTokens = tokenize(question)
  if (queryTokens.length === 0) return []

  const N = Math.max(docs.length, 1)
  const idf = computeIdf(docs)
  const normalizedQuestion = normalizeText(question)
  const categoryIntent = detectCategoryIntent(normalizedQuestion)

  const expanded = expandQuery(queryTokens)

  // Peso total possivel (apenas termos diretos, ponderado por IDF) para a cobertura.
  const directTerms = expanded.filter((e) => e.weight === 1)
  const totalDirectIdf = directTerms.reduce((sum, e) => sum + idfOf(e.term, idf, N), 0) || 1

  const results: SearchResult[] = []

  for (const doc of docs) {
    const titleSet = new Set(doc.titleTokens)
    const bodySet = new Set(doc.bodyTokens)

    let score = 0
    let matchedDirectIdf = 0

    for (const { term, weight } of expanded) {
      const termIdf = idfOf(term, idf, N)
      let hit = false

      if (titleSet.has(term)) {
        score += 5 * termIdf * weight
        hit = true
      }

      if (bodySet.has(term)) {
        const freq = doc.bodyTokens.filter((b) => b === term).length
        score += (1.5 + Math.min(freq - 1, 4) * 0.5) * termIdf * weight
        hit = true
      } else if (term.length >= 4) {
        // casamento parcial (prefixo) para termos maiores
        const partial = doc.bodyTokens.some((b) => b.startsWith(term) || term.startsWith(b))
        if (partial) {
          score += 0.6 * termIdf * weight
          hit = true
        }
      }

      if (hit && weight === 1) matchedDirectIdf += termIdf
    }

    if (score === 0) continue

    // Cobertura ponderada por IDF: so termos distintivos elevam a cobertura.
    const coverage = matchedDirectIdf / totalDirectIdf

    // Bonus se a pergunta inteira aparece como frase no documento.
    const docPhrase = normalizeText(`${doc.title} ${doc.body}`)
    if (normalizedQuestion.length >= 6 && docPhrase.includes(normalizedQuestion)) {
      score += 8
    }

    // Recompensa cobertura alta dos termos distintivos.
    score += coverage * 4

    // Ajuste por intencao de categoria.
    if (categoryIntent) {
      if (doc.category === categoryIntent) score *= 1.35
      else score *= 0.85
    }

    results.push({ doc, score, coverage })
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, limit)
}

/**
 * Decide se o melhor resultado e confiavel o bastante para ser mostrado.
 * Exige pontuacao minima E cobertura relevante dos termos distintivos da
 * pergunta, evitando respostas que casam apenas com palavras genericas.
 */
export function isConfident(results: SearchResult[]): boolean {
  if (results.length === 0) return false
  const best = results[0]
  return best.score >= 5 && best.coverage >= 0.4
}
