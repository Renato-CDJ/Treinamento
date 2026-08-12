"use client"

/**
 * Polling com consciência de visibilidade da aba.
 *
 * Problema: quando o operador deixa a aplicação aberta em segundo plano,
 * os `setInterval` continuavam disparando requisições ao Supabase 24/7,
 * estourando o limite do banco muito rápido.
 *
 * Solução: este helper NÃO dispara o callback enquanto a aba estiver
 * em segundo plano (`document.hidden`). Assim que o usuário volta o foco
 * para a aba, dispara uma única vez caso os dados estejam "velhos"
 * (passou mais tempo que o intervalo desde a última execução).
 *
 * Reduz drasticamente as requisições sem sacrificar a atualização
 * dos dados enquanto o usuário está de fato usando a tela.
 */
export function startVisibilityAwarePolling(
  callback: () => void,
  intervalMs: number,
  options?: { runOnFocusIfStale?: boolean },
): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {}
  }

  const runOnFocusIfStale = options?.runOnFocusIfStale ?? true
  // Assume que o chamador já fez o fetch inicial ao montar,
  // por isso iniciamos "lastRun" como agora para não duplicar requisições.
  let lastRun = Date.now()

  const tick = () => {
    if (document.visibilityState !== "visible") return
    lastRun = Date.now()
    callback()
  }

  const interval = setInterval(tick, intervalMs)

  const handleVisibility = () => {
    if (
      runOnFocusIfStale &&
      document.visibilityState === "visible" &&
      Date.now() - lastRun >= intervalMs
    ) {
      tick()
    }
  }

  document.addEventListener("visibilitychange", handleVisibility)

  return () => {
    clearInterval(interval)
    document.removeEventListener("visibilitychange", handleVisibility)
  }
}
