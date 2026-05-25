/**
 * Cache Service - Estratégia híbrida para reduzir consumo do Supabase
 * 
 * - Operadores usam localStorage como cache principal
 * - Dados são buscados do Supabase apenas quando há atualizações
 * - Admin atualiza um timestamp de versão ao fazer alterações
 * - Operadores checam versão periodicamente (polling leve)
 */

import { createClient } from "@/lib/supabase/client"

// Chaves de cache no localStorage
const CACHE_KEYS = {
  PRODUCTS: "cache_products",
  SCRIPTS: "cache_scripts",
  TABULATIONS: "cache_tabulations",
  SITUATIONS: "cache_situations",
  CHANNELS: "cache_channels",
  RESULT_CODES: "cache_result_codes",
  INITIAL_GUIDE: "cache_initial_guide",
  MESSAGES: "cache_messages",
  APP_SETTINGS: "cache_app_settings",
  PHRASEOLOGY: "cache_phraseology",
  DATA_VERSION: "cache_data_version",
  LAST_SYNC: "cache_last_sync",
} as const

// Tempo mínimo entre sincronizações (3 minutos)
const MIN_SYNC_INTERVAL = 3 * 60 * 1000

// Versão do cache - incrementar quando houver mudanças na estrutura
const CACHE_SCHEMA_VERSION = "1.0"

// Função para notificar componentes sobre atualização do cache
function notifyCacheUpdate(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent("cache-updated"))
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  schemaVersion: string
}

interface DataVersion {
  products: string
  scripts: string
  tabulations: string
  situations: string
  channels: string
  result_codes: string
  initial_guide: string
  messages: string
  app_settings: string
  phraseology: string
}

// ============================================
// FUNÇÕES AUXILIARES DE CACHE
// ============================================

function getFromCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null
    
    const entry: CacheEntry<T> = JSON.parse(cached)
    
    // Verificar se a versão do schema é compatível
    if (entry.schemaVersion !== CACHE_SCHEMA_VERSION) {
      localStorage.removeItem(key)
      return null
    }
    
    return entry.data
  } catch {
    return null
  }
}

function setToCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return
  
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      schemaVersion: CACHE_SCHEMA_VERSION,
    }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch (e) {
    console.warn("[Cache] Erro ao salvar no cache:", e)
  }
}

function getCacheTimestamp(key: string): number {
  if (typeof window === "undefined") return 0
  
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return 0
    
    const entry: CacheEntry<unknown> = JSON.parse(cached)
    return entry.timestamp || 0
  } catch {
    return 0
  }
}

// ============================================
// VERSÃO DOS DADOS (para saber quando sincronizar)
// ============================================

async function getRemoteDataVersion(): Promise<DataVersion | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "data_version")
      .maybeSingle()
    
    if (error) {
      // Silenciar erro se a tabela nao existir ou registro nao encontrado
      if (error.code === "PGRST116" || error.code === "42P01") {
        return null
      }
      return null
    }
    
    if (!data) return null
    return data.value as DataVersion
  } catch {
    return null
  }
}

function getLocalDataVersion(): DataVersion | null {
  return getFromCache<DataVersion>(CACHE_KEYS.DATA_VERSION)
}

function setLocalDataVersion(version: DataVersion): void {
  setToCache(CACHE_KEYS.DATA_VERSION, version)
}

// Função para admin atualizar versão de um tipo de dado
export async function updateDataVersion(dataType: keyof DataVersion): Promise<void> {
  try {
    const supabase = createClient()
    
    // Get current version
    const { data: currentData } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "data_version")
      .maybeSingle()
    
    const currentVersion = currentData?.value || {}
    
    await supabase
      .from("app_settings")
      .upsert({
        key: "data_version",
        value: {
          ...currentVersion,
          [dataType]: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
  } catch {
    // Silenciar erro se a tabela nao existir
  }
}

// ============================================
// FUNÇÕES DE SINCRONIZAÇÃO
// ============================================

async function fetchAndCacheProducts(): Promise<any[]> {
  const supabase = createClient()
  console.log("[v0] Fetching products from Supabase...")
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })
  
  if (error) {
    console.error("[v0] Error fetching products:", error)
  }
  
  const products = data || []
  console.log("[v0] Products fetched:", products.length, products)
  setToCache(CACHE_KEYS.PRODUCTS, products)
  return products
}

async function fetchAndCacheScripts(): Promise<any[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("scripts")
    .select("*")
    .eq("is_active", true)
  
  const scripts = data || []
  console.log("[v0] fetchAndCacheScripts - scripts with tabulations:", scripts.map(s => ({ id: s.id, title: s.title, tabulations: s.tabulations })))
  setToCache(CACHE_KEYS.SCRIPTS, scripts)
  return scripts
}

async function fetchAndCacheTabulations(): Promise<any[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("tabulations")
    .select("*")
    .eq("is_active", true)
  
  const tabulations = data || []
  setToCache(CACHE_KEYS.TABULATIONS, tabulations)
  return tabulations
}

async function fetchAndCacheSituations(): Promise<any[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("situations")
    .select("*")
    .eq("is_active", true)
  
  const situations = data || []
  setToCache(CACHE_KEYS.SITUATIONS, situations)
  return situations
}

async function fetchAndCacheChannels(): Promise<any[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("is_active", true)
  
  const channels = data || []
  setToCache(CACHE_KEYS.CHANNELS, channels)
  return channels
}

async function fetchAndCacheResultCodes(): Promise<any[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("result_codes")
    .select("*")
    .eq("is_active", true)
  
  const resultCodes = data || []
  setToCache(CACHE_KEYS.RESULT_CODES, resultCodes)
  return resultCodes
}

async function fetchAndCacheInitialGuide(): Promise<any[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("initial_guide")
    .select("*")
    .eq("is_active", true)
    .order("step_order", { ascending: true })
  
  const guide = data || []
  setToCache(CACHE_KEYS.INITIAL_GUIDE, guide)
  return guide
}

async function fetchAndCacheMessages(): Promise<any[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("is_active", true)
  
  const messages = data || []
  setToCache(CACHE_KEYS.MESSAGES, messages)
  return messages
}

async function fetchAndCacheAppSettings(): Promise<Record<string, any>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
  
  const settings: Record<string, any> = {}
  if (data) {
    data.forEach((item) => {
      if (item.key !== "data_version") {
        settings[item.key] = item.value
      }
    })
  }
  
  setToCache(CACHE_KEYS.APP_SETTINGS, settings)
  return settings
}

async function fetchAndCachePhraseology(): Promise<any[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("phraseology")
    .select("*")
    .eq("is_active", true)
  
  const phraseology = data || []
  setToCache(CACHE_KEYS.PHRASEOLOGY, phraseology)
  return phraseology
}

// ============================================
// API PÚBLICA PARA OPERADORES
// ============================================

/**
 * Verifica se precisa sincronizar e sincroniza apenas os dados alterados
 */
export async function syncIfNeeded(): Promise<boolean> {
  if (typeof window === "undefined") return false
  
  // Verificar intervalo mínimo entre sincronizações
  const lastSync = parseInt(localStorage.getItem(CACHE_KEYS.LAST_SYNC) || "0", 10)
  const now = Date.now()
  
  if (now - lastSync < MIN_SYNC_INTERVAL) {
    return false
  }
  
  try {
    const remoteVersion = await getRemoteDataVersion()
    const localVersion = getLocalDataVersion()
    
    if (!remoteVersion) {
      // Se não há versão remota, sincronizar tudo pela primeira vez
      await syncAll()
      return true
    }
    
    let synced = false
    
    // Comparar versões e sincronizar apenas o que mudou
    if (!localVersion || localVersion.products !== remoteVersion.products) {
      await fetchAndCacheProducts()
      synced = true
    }
    
    if (!localVersion || localVersion.scripts !== remoteVersion.scripts) {
      await fetchAndCacheScripts()
      synced = true
    }
    
    if (!localVersion || localVersion.tabulations !== remoteVersion.tabulations) {
      await fetchAndCacheTabulations()
      synced = true
    }
    
    if (!localVersion || localVersion.situations !== remoteVersion.situations) {
      await fetchAndCacheSituations()
      synced = true
    }
    
    if (!localVersion || localVersion.channels !== remoteVersion.channels) {
      await fetchAndCacheChannels()
      synced = true
    }
    
    if (!localVersion || localVersion.result_codes !== remoteVersion.result_codes) {
      await fetchAndCacheResultCodes()
      synced = true
    }
    
    if (!localVersion || localVersion.initial_guide !== remoteVersion.initial_guide) {
      await fetchAndCacheInitialGuide()
      synced = true
    }
    
    if (!localVersion || localVersion.messages !== remoteVersion.messages) {
      await fetchAndCacheMessages()
      synced = true
    }
    
    if (!localVersion || localVersion.app_settings !== remoteVersion.app_settings) {
      await fetchAndCacheAppSettings()
      synced = true
    }
    
    if (!localVersion || localVersion.phraseology !== remoteVersion.phraseology) {
      await fetchAndCachePhraseology()
      synced = true
    }
    
    // Atualizar versão local e timestamp
    setLocalDataVersion(remoteVersion)
    localStorage.setItem(CACHE_KEYS.LAST_SYNC, String(now))
    
    // Notificar componentes sobre atualização do cache
    if (synced) {
      notifyCacheUpdate()
    }
    
    return synced
  } catch (e) {
    console.error("[Cache] Erro ao sincronizar:", e)
    return false
  }
}

/**
 * Força sincronização de todos os dados
 */
export async function syncAll(): Promise<void> {
  if (typeof window === "undefined") return
  
  try {
    await Promise.all([
      fetchAndCacheProducts(),
      fetchAndCacheScripts(),
      fetchAndCacheTabulations(),
      fetchAndCacheSituations(),
      fetchAndCacheChannels(),
      fetchAndCacheResultCodes(),
      fetchAndCacheInitialGuide(),
      fetchAndCacheMessages(),
      fetchAndCacheAppSettings(),
      fetchAndCachePhraseology(),
    ])
    
    const remoteVersion = await getRemoteDataVersion()
    if (remoteVersion) {
      setLocalDataVersion(remoteVersion)
    }
    
    localStorage.setItem(CACHE_KEYS.LAST_SYNC, String(Date.now()))
    
    // Notificar componentes sobre atualização do cache
    notifyCacheUpdate()
  } catch (e) {
    console.error("[Cache] Erro ao sincronizar tudo:", e)
  }
}

/**
 * Limpa todo o cache local
 */
export function clearCache(): void {
  if (typeof window === "undefined") return
  
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}

// ============================================
// GETTERS COM CACHE (para operadores)
// ============================================

export function getCachedProducts(): any[] {
  return getFromCache<any[]>(CACHE_KEYS.PRODUCTS) || []
}

export function getCachedScripts(): any[] {
  return getFromCache<any[]>(CACHE_KEYS.SCRIPTS) || []
}

export function getCachedScriptsByProductId(productId: string): any[] {
  const scripts = getCachedScripts()
  return scripts
    .filter(s => s.product_id === productId)
    .sort((a, b) => (a.step_order || 0) - (b.step_order || 0))
}

export function getCachedScriptById(scriptId: string): any | null {
  const scripts = getCachedScripts()
  return scripts.find(s => s.id === scriptId) || null
}

export function getCachedTabulations(): any[] {
  return getFromCache<any[]>(CACHE_KEYS.TABULATIONS) || []
}

export function getCachedSituations(): any[] {
  return getFromCache<any[]>(CACHE_KEYS.SITUATIONS) || []
}

export function getCachedChannels(): any[] {
  return getFromCache<any[]>(CACHE_KEYS.CHANNELS) || []
}

export function getCachedResultCodes(): any[] {
  return getFromCache<any[]>(CACHE_KEYS.RESULT_CODES) || []
}

export function getCachedInitialGuide(): any[] {
  return getFromCache<any[]>(CACHE_KEYS.INITIAL_GUIDE) || []
}

export function getCachedMessages(): any[] {
  return getFromCache<any[]>(CACHE_KEYS.MESSAGES) || []
}

export function getCachedAppSettings(): Record<string, any> {
  return getFromCache<Record<string, any>>(CACHE_KEYS.APP_SETTINGS) || {}
}

export function getCachedPhraseology(): any[] {
  return getFromCache<any[]>(CACHE_KEYS.PHRASEOLOGY) || []
}

export function getCachedProductById(productId: string): any | null {
  const products = getCachedProducts()
  return products.find(p => p.id === productId) || null
}

// ============================================
// HOOK PARA AUTO-SYNC
// ============================================

export function getLastSyncTime(): number {
  if (typeof window === "undefined") return 0
  return parseInt(localStorage.getItem(CACHE_KEYS.LAST_SYNC) || "0", 10)
}

export function hasCachedData(): boolean {
  if (typeof window === "undefined") return false
  return getCachedProducts().length > 0 || getCachedScripts().length > 0
}
