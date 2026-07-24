import { NextResponse } from "next/server"
import { generateText, Output } from "ai"
import { z } from "zod"
import { selectRelevantContext, type KnowledgeSection } from "@/lib/assistant-knowledge-loader"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MODEL = "openai/gpt-4.1-mini"

const answerSchema = z.object({
  encontrado: z
    .boolean()
    .describe("true se a resposta esta presente no CONTEUDO fornecido; false caso contrario."),
  resposta: z
    .string()
    .describe(
      "Resposta objetiva e pratica para o operador, em portugues. Vazia se encontrado=false.",
    ),
  fonte: z
    .string()
    .describe("Titulo do trecho/documento usado como base. Vazio se encontrado=false."),
})

interface HistoryItem {
  role: "user" | "assistant"
  content: string
}

const FALLBACK =
  "Nao localizei essa informacao no roteiro nem nos materiais de apoio deste produto. " +
  "Recomendo confirmar com seu supervisor ou especialista para garantir a orientacao correta."

/**
 * Resposta sem IA: entrega o(s) trecho(s) mais relevante(s) encontrado(s) na
 * base. Usada quando o AI Gateway esta indisponivel (sem chave, sem cartao,
 * indisponibilidade). Ainda assim e muito melhor que "nao encontrei", pois a
 * recuperacao ja localizou o conteudo certo.
 */
function buildRetrievalAnswer(usedSections: KnowledgeSection[]) {
  if (usedSections.length === 0) {
    return { encontrado: false, resposta: FALLBACK, needsSpecialist: true, sourceTitle: null }
  }
  const best = usedSections[0]
  const resposta = best.text?.trim() || best.title
  return {
    encontrado: true,
    resposta,
    sourceTitle: best.title,
    category: best.origin === "documento" ? "documento" : "roteiro",
    needsSpecialist: false,
  }
}

export async function POST(req: Request) {
  let question = ""
  let productName = ""
  let history: HistoryItem[] = []

  try {
    const body = await req.json()
    question = String(body?.question || "").trim()
    productName = String(body?.productName || "").trim()
    if (Array.isArray(body?.history)) {
      history = body.history
        .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-6)
    }
  } catch {
    return NextResponse.json({ error: "Requisicao invalida." }, { status: 400 })
  }

  if (!question) {
    return NextResponse.json({ error: "Pergunta vazia." }, { status: 400 })
  }

  // 1) Recuperacao: localiza no roteiro do produto + materiais de apoio.
  let contextText = ""
  let usedSections: KnowledgeSection[] = []
  let productLabelInScope = ""
  try {
    const ctx = await selectRelevantContext(question, productName)
    contextText = ctx.contextText
    usedSections = ctx.usedSections
    productLabelInScope = ctx.productLabelInScope ?? ""
  } catch (error) {
    console.error("[v0] Erro ao carregar a base de conhecimento:", error)
    return NextResponse.json(
      { encontrado: false, resposta: FALLBACK, needsSpecialist: true, sourceTitle: null },
      { status: 200 },
    )
  }

  if (!contextText) {
    return NextResponse.json(
      { encontrado: false, resposta: FALLBACK, needsSpecialist: true, sourceTitle: null },
      { status: 200 },
    )
  }

  // 2) Sem IA configurada: devolve o melhor trecho encontrado (ainda assertivo).
  if (!process.env.AI_GATEWAY_API_KEY) {
    return NextResponse.json(buildRetrievalAnswer(usedSections), { status: 200 })
  }

  // 3) Com IA: refina/interpreta a intencao usando apenas o conteudo recuperado.
  try {
    const historyText = history.length
      ? "\n\nHISTORICO RECENTE DA CONVERSA (para dar continuidade):\n" +
        history.map((m) => `${m.role === "user" ? "Operador" : "Assistente"}: ${m.content}`).join("\n")
      : ""

    const system = [
      "Voce e o Assistente do Roteiro de uma operacao de cobranca/atendimento.",
      "Seu publico sao os OPERADORES durante a ligacao com o cliente.",
      productLabelInScope
        ? `O operador esta atendendo o produto: "${productLabelInScope}". Priorize esse produto.`
        : productName
          ? `O operador esta atendendo o produto: "${productName}".`
          : "",
      "",
      "REGRAS OBRIGATORIAS:",
      "1. Responda SOMENTE com base no CONTEUDO fornecido abaixo. Nao invente nada.",
      "2. Interprete a intencao do operador. Perguntas informais como 'cliente esta sem dinheiro, o que eu tabulo?' ou 'o que falo se ele for pagar hoje?' devem ser mapeadas para a situacao/tabulacao/fraseologia correspondente no CONTEUDO.",
      "3. Se a pergunta pede uma TABULACAO, diga o NOME exato da tabulacao e quando usa-la. Se pede uma FRASEOLOGIA/o que falar, entregue a frase pronta para o operador ler.",
      "4. Seja direto, pratico e curto. Va direto ao ponto que resolve a duvida na ligacao. Use passos ou a frase pronta quando fizer sentido.",
      "5. Nao misture conteudo de outros produtos. Se algo pertence claramente a outro produto, ignore.",
      "6. Se a resposta NAO estiver no CONTEUDO, defina encontrado=false e deixe resposta vazia. Nao chute.",
      "7. Responda sempre em portugues do Brasil.",
    ]
      .filter(Boolean)
      .join("\n")

    const prompt = `PERGUNTA DO OPERADOR:\n${question}${historyText}\n\nCONTEUDO DISPONIVEL (roteiro e materiais de apoio):\n\n${contextText}`

    const { output } = await generateText({
      model: MODEL,
      temperature: 0.2,
      system,
      prompt,
      output: Output.object({ schema: answerSchema }),
    })

    if (!output || !output.encontrado || !output.resposta.trim()) {
      return NextResponse.json(
        { encontrado: false, resposta: FALLBACK, needsSpecialist: true, sourceTitle: null },
        { status: 200 },
      )
    }

    // Descobre a categoria/rotulo da fonte a partir das secoes usadas.
    const match = usedSections.find(
      (s) => output.fonte && s.title.toLowerCase() === output.fonte.trim().toLowerCase(),
    )
    const sourceTitle = output.fonte?.trim() || match?.title || null
    const category = match?.origin === "documento" ? "documento" : "roteiro"

    return NextResponse.json(
      {
        encontrado: true,
        resposta: output.resposta.trim(),
        sourceTitle,
        category,
        needsSpecialist: false,
      },
      { status: 200 },
    )
  } catch (error) {
    // IA indisponivel (ex.: 403 do Gateway/sem cartao, timeout). Como a
    // recuperacao ja encontrou o conteudo certo, devolvemos o melhor trecho.
    console.error("[v0] IA indisponivel, usando resposta por recuperacao:", error)
    return NextResponse.json(buildRetrievalAnswer(usedSections), { status: 200 })
  }
}
