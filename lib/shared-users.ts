"use client"

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"

/**
 * Store compartilhado de usuários.
 *
 * Problema de egress: vários hooks (useSupabaseUsers, useAllUsers,
 * useOperatorPresence, estatísticas) liam a tabela `users` em ciclos
 * de polling independentes. Com várias abas/paineis abertos, a MESMA
 * lista de usuários era baixada dezenas de vezes por minuto.
 *
 * Solução: uma ÚNICA fonte de verdade em memória, com:
 *  - deduplicação de requisições concorrentes (uma promise em voo)
 *  - TTL mínimo (não refaz fetch se os dados são recentes)
 *  - um único conjunto de assinantes notificados a cada atualização
 *
 * IMPORTANTE (segurança): NUNCA selecionamos a coluna `password`.
 * Apenas as colunas realmente usadas pela aplicação são trafegadas.
 */

// Colunas seguras (sem `password`) usadas pela aplicação.
// `has_password` é uma coluna GERADA no banco (booleana) que apenas indica
// se existe senha definida, sem nunca revelar a senha em si.
export const USER_SAFE_COLUMNS =
  "id,username,name,email,role,admin_type,allowed_tabs,is_online,is_active,created_at,last_login,last_activity,last_script_access,current_product,current_screen,has_password"

// TTL mínimo entre fetches reais (evita rajadas de requisições).
const MIN_FETCH_INTERVAL = 30_000

type RawUser = Record<string, any>

let cache: RawUser[] = []
let lastFetch = 0
let inFlight: Promise<RawUser[]> | null = null
const listeners = new Set<(users: RawUser[]) => void>()

function notify() {
  for (const listener of listeners) {
    listener(cache)
  }
}

export function getCachedUsers(): RawUser[] {
  return cache
}

/**
 * Busca a lista de usuários de forma compartilhada.
 * - Se houver uma requisição em voo, reutiliza a mesma promise.
 * - Se os dados forem recentes (< TTL) e não for `force`, retorna o cache.
 */
export async function fetchSharedUsers(force = false): Promise<RawUser[]> {
  if (!isSupabaseConfigured()) return cache

  const isFresh = Date.now() - lastFetch < MIN_FETCH_INTERVAL
  if (!force && isFresh && cache.length > 0) {
    return cache
  }

  if (inFlight) {
    return inFlight
  }

  const supabase = createClient()
  if (!supabase) return cache

  inFlight = (async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(USER_SAFE_COLUMNS)
        .order("created_at", { ascending: true })

      if (!error && data) {
        cache = data as RawUser[]
        lastFetch = Date.now()
        notify()
      }
      return cache
    } finally {
      inFlight = null
    }
  })()

  return inFlight
}

export function subscribeUsers(listener: (users: RawUser[]) => void): () => void {
  listeners.add(listener)
  // Entrega imediata do cache atual (se existir)
  if (cache.length > 0) {
    listener(cache)
  }
  return () => {
    listeners.delete(listener)
  }
}
