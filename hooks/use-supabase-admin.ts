"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { updateDataVersion } from "@/lib/cache-service"

// Polling interval - 60 seconds para reduzir requisições
const POLLING_INTERVAL = 60000

// Collection/table names
const TABLES = {
  USERS: "users",
  SCRIPTS: "scripts",
  PRODUCTS: "products",
  TABULATIONS: "tabulations",
  SITUATIONS: "situations",
  CHANNELS: "channels",
  MESSAGES: "messages",
  QUIZZES: "quizzes",
  QUIZ_ATTEMPTS: "quiz_attempts",
  PRESENTATIONS: "presentations",
  PRESENTATION_PROGRESS: "presentation_progress",
  QUALITY_POSTS: "quality_posts",
  FEEDBACKS: "feedbacks",
  RESULT_CODES: "result_codes",
  ADMIN_QUESTIONS: "admin_questions",
  NOTES: "notes",
  APP_SETTINGS: "app_settings",
  INITIAL_GUIDE: "initial_guide",
  CONTRACTS: "contracts",
  PHRASEOLOGY: "phraseology",
  SUPERVISOR_TEAMS: "supervisor_teams",
  CAMPAIGNS: "campaigns",
  WORD_CLOUD: "word_cloud",
} as const

// Mapeamento de table para chave de versão
const TABLE_TO_VERSION_KEY: Record<string, string> = {
  [TABLES.PRODUCTS]: "products",
  [TABLES.SCRIPTS]: "scripts",
  [TABLES.TABULATIONS]: "tabulations",
  [TABLES.SITUATIONS]: "situations",
  [TABLES.CHANNELS]: "channels",
  [TABLES.RESULT_CODES]: "result_codes",
  [TABLES.INITIAL_GUIDE]: "initial_guide",
  [TABLES.MESSAGES]: "messages",
  [TABLES.APP_SETTINGS]: "app_settings",
  [TABLES.PHRASEOLOGY]: "phraseology",
}

// Generic hook for CRUD operations with polling (sem realtime)
export function useSupabaseTable<T extends { id: string }>(
  tableName: string,
  orderByField: string = "created_at",
  ascending: boolean = false
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: result, error: fetchError } = await supabase
        .from(tableName)
        .select("*")
        .order(orderByField, { ascending })

      if (fetchError) throw fetchError

      setData(result as T[])
      setError(null)
    } catch (e: any) {
      setError(e.message || "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }, [tableName, orderByField, ascending])

  useEffect(() => {
    fetchData()

    // Polling ao invés de realtime
    const interval = setInterval(fetchData, POLLING_INTERVAL)

    return () => {
      clearInterval(interval)
    }
  }, [tableName, fetchData])

  const create = async (item: Omit<T, "id" | "created_at" | "updated_at">) => {
    try {
      const supabase = createClient()
      const { data: result, error: insertError } = await supabase
        .from(tableName)
        .insert(item)
        .select()
        .single()

      if (insertError) throw insertError

      // Atualizar versão dos dados para invalidar cache dos operadores
      const versionKey = TABLE_TO_VERSION_KEY[tableName]
      if (versionKey) {
        updateDataVersion(versionKey as any).catch(console.error)
      }

      // Refetch para atualizar lista
      fetchData()

      return { data: result as T, error: null }
    } catch (e: any) {
      return { data: null, error: e.message || "Erro ao criar" }
    }
  }

  const update = async (id: string, updates: Partial<T>) => {
    try {
      const supabase = createClient()
      const { data: result, error: updateError } = await supabase
        .from(tableName)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (updateError) throw updateError

      // Atualizar versão dos dados para invalidar cache dos operadores
      const versionKey = TABLE_TO_VERSION_KEY[tableName]
      if (versionKey) {
        updateDataVersion(versionKey as any).catch(console.error)
      }

      // Refetch para atualizar lista
      fetchData()

      return { data: result as T, error: null }
    } catch (e: any) {
      return { data: null, error: e.message || "Erro ao atualizar" }
    }
  }

  const remove = async (id: string) => {
    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq("id", id)

      if (deleteError) throw deleteError

      // Atualizar versão dos dados para invalidar cache dos operadores
      const versionKey = TABLE_TO_VERSION_KEY[tableName]
      if (versionKey) {
        updateDataVersion(versionKey as any).catch(console.error)
      }

      // Refetch para atualizar lista
      fetchData()

      return { error: null }
    } catch (e: any) {
      return { error: e.message || "Erro ao excluir" }
    }
  }

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    create,
    update,
    remove,
  }
}

// Specific hooks for each table
export function useScripts() {
  return useSupabaseTable<{
    id: string
    title: string
    content: string
    category: string
    product_id?: string
    product_name?: string
    step_order?: number
    buttons?: any
    tabulations?: any
    alert?: any
    is_active: boolean
    created_at: string
    updated_at: string
  }>(TABLES.SCRIPTS)
}

// Get scripts for a specific product
export async function getScriptsByProductId(productId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(TABLES.SCRIPTS)
    .select("*")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("step_order", { ascending: true })

  if (error) {
    console.error("[Supabase] Error fetching scripts:", error)
    return []
  }

  return data || []
}

// Get the first script step for a product
export async function getFirstScriptStep(productId: string) {
  const scripts = await getScriptsByProductId(productId)
  return scripts.length > 0 ? scripts[0] : null
}

// Get a specific script step by ID
export async function getScriptStepByIdFromSupabase(stepId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(TABLES.SCRIPTS)
    .select("*")
    .eq("id", stepId)
    .single()

  if (error) return null
  return data
}

// Hook for operator to use scripts with polling
export function useProductScripts(productId: string | null) {
  const [scripts, setScripts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchScripts = useCallback(async () => {
    if (!productId) {
      setScripts([])
      return
    }

    setLoading(true)
    const data = await getScriptsByProductId(productId)
    
    console.log("[v0] Raw scripts data from Supabase:", data.map((s: any) => ({ id: s.id, title: s.title, tabulations: s.tabulations })))

    const mappedScripts = data.map((s: any) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      productId: s.product_id,
      productName: s.product_name,
      order: s.step_order,
      buttons: s.buttons || [],
      tabulations: s.tabulations || [],
      alert: s.alert,
      isActive: s.is_active,
    }))

    setScripts(mappedScripts)
    setLoading(false)
  }, [productId])

  useEffect(() => {
    if (!productId) {
      setScripts([])
      return
    }

    fetchScripts()

    // Polling ao invés de realtime
    const interval = setInterval(fetchScripts, POLLING_INTERVAL)

    return () => {
      clearInterval(interval)
    }
  }, [productId, fetchScripts])

  const getStepById = useCallback(
    (stepId: string) => {
      return scripts.find((s) => s.id === stepId) || null
    },
    [scripts]
  )

  const getFirstStep = useCallback(() => {
    return scripts.length > 0 ? scripts[0] : null
  }, [scripts])

  return { scripts, loading, getStepById, getFirstStep, refetch: fetchScripts }
}

export function useProducts() {
  return useSupabaseTable<{
    id: string
    name: string
    description: string
    category: string
    price: number
    is_active: boolean
    details: Record<string, any>
    created_at: string
    updated_at: string
  }>(TABLES.PRODUCTS)
}

export function useTabulations() {
  return useSupabaseTable<{
    id: string
    name: string
    description: string
    color: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>(TABLES.TABULATIONS)
}

export function useSituations() {
  return useSupabaseTable<{
    id: string
    name: string
    description: string
    color: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>(TABLES.SITUATIONS)
}

export function useChannels() {
  return useSupabaseTable<{
    id: string
    name: string
    description: string
    icon: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>(TABLES.CHANNELS)
}

export function useWordCloud() {
  return useSupabaseTable<{
    id: string
    word: string
    description: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>(TABLES.WORD_CLOUD)
}

export function useResultCodes() {
  return useSupabaseTable<{
    id: string
    code: string
    name: string
    description: string
    category: string
    color: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>(TABLES.RESULT_CODES)
}

export function useInitialGuide() {
  return useSupabaseTable<{
    id: string
    title: string
    content: string
    step_order: number
    is_active: boolean
    created_at: string
    updated_at: string
  }>(TABLES.INITIAL_GUIDE, "step_order", true)
}

export function useContracts() {
  return useSupabaseTable<{
    id: string
    name: string
    description: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>(TABLES.CONTRACTS)
}

export function useNotes(userId?: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const supabase = createClient()
    const { data: notes, error } = await supabase
      .from(TABLES.NOTES)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (!error && notes) {
      setData(notes)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (!userId) return

    fetchData()

    // Polling ao invés de realtime
    const interval = setInterval(fetchData, POLLING_INTERVAL)

    return () => {
      clearInterval(interval)
    }
  }, [userId, fetchData])

  const create = async (note: { title: string; content: string; color?: string }) => {
    const supabase = createClient()
    const { data: result, error } = await supabase
      .from(TABLES.NOTES)
      .insert({ ...note, user_id: userId })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    fetchData()
    return { data: result, error: null }
  }

  const update = async (id: string, updates: any) => {
    const supabase = createClient()
    const { data: result, error } = await supabase
      .from(TABLES.NOTES)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    fetchData()
    return { data: result, error: null }
  }

  const remove = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from(TABLES.NOTES).delete().eq("id", id)
    if (error) return { error: error.message }
    fetchData()
    return { error: null }
  }

  return { data, loading, refetch: fetchData, create, update, remove }
}

export function useAppSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLES.APP_SETTINGS).select("*")

    if (!error && data) {
      const settingsMap: Record<string, any> = {}
      data.forEach((item) => {
        settingsMap[item.key] = item.value
      })
      setSettings(settingsMap)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSettings()

    // Polling ao invés de realtime
    const interval = setInterval(fetchSettings, POLLING_INTERVAL)

    return () => {
      clearInterval(interval)
    }
  }, [fetchSettings])

  const updateSetting = async (key: string, value: any) => {
    const supabase = createClient()
    const { error } = await supabase
      .from(TABLES.APP_SETTINGS)
      .upsert({ key, value, updated_at: new Date().toISOString() })

    if (error) return { error: error.message }
    fetchSettings()
    return { error: null }
  }

  return { settings, loading, refetch: fetchSettings, updateSetting }
}

export function usePhraseology() {
  return useSupabaseTable<{
    id: string
    title: string
    content: string
    category: string
    shortcut: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>(TABLES.PHRASEOLOGY)
}

export function useCampaigns() {
  return useSupabaseTable<{
    id: string
    name: string
    how_it_works: string
    positive_case: string
    negative_case: string
    delay_range: string
    complement: string
    system_site: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>(TABLES.CAMPAIGNS)
}

// Helper function to resolve tabulation IDs or names to full tabulation objects
async function resolveTabulationIds(
  supabase: any,
  tabulationIdsOrNames: string[] | undefined
): Promise<Array<{ id: string; name: string; description: string }>> {
  console.log("[v0] resolveTabulationIds called with:", tabulationIdsOrNames)
  
  if (!tabulationIdsOrNames || tabulationIdsOrNames.length === 0) {
    return []
  }

  // Separate IDs from names
  // IDs typically have format like "tab-1", UUIDs, or contain hyphens/underscores with alphanumeric patterns
  // Names are usually human-readable text with spaces and special characters
  const potentialIds: string[] = []
  const potentialNames: string[] = []

  for (const value of tabulationIdsOrNames) {
    // Check if it looks like an ID (contains only alphanumeric, hyphens, underscores, or is a UUID)
    const isLikelyId = /^[a-zA-Z0-9_-]+$/.test(value) && !value.includes(" ")
    if (isLikelyId) {
      potentialIds.push(value)
    } else {
      potentialNames.push(value)
    }
  }

  console.log("[v0] potentialIds:", potentialIds, "potentialNames:", potentialNames)

  const results: Array<{ id: string; name: string; description: string }> = []

  // First, try to fetch by ID
  if (potentialIds.length > 0) {
    const { data: tabulationsById } = await supabase
      .from(TABLES.TABULATIONS)
      .select("id, name, description")
      .in("id", potentialIds)

    console.log("[v0] tabulationsById result:", tabulationsById)

    if (tabulationsById && tabulationsById.length > 0) {
      for (const tab of tabulationsById) {
        results.push({ id: tab.id, name: tab.name, description: tab.description || "" })
      }
    }

    // For IDs that weren't found, try searching by name (in case user passed a name that looks like an ID)
    const foundIds = new Set(tabulationsById?.map((t: any) => t.id) || [])
    const notFoundAsIds = potentialIds.filter((id) => !foundIds.has(id))
    if (notFoundAsIds.length > 0) {
      potentialNames.push(...notFoundAsIds)
    }
  }

  // Then, fetch by name (case-insensitive)
  if (potentialNames.length > 0) {
    // Use ilike for case-insensitive matching
    const { data: tabulationsByName } = await supabase
      .from(TABLES.TABULATIONS)
      .select("id, name, description")

    console.log("[v0] All tabulations from DB:", tabulationsByName)

    if (tabulationsByName && tabulationsByName.length > 0) {
      for (const name of potentialNames) {
        // Find by exact name match (case-insensitive)
        const tab = tabulationsByName.find(
          (t: any) => t.name.toLowerCase() === name.toLowerCase()
        )
        console.log("[v0] Looking for name:", name, "Found:", tab)
        if (tab && !results.find((r) => r.id === tab.id)) {
          results.push({ id: tab.id, name: tab.name, description: tab.description || "" })
        }
      }
    }
  }

  console.log("[v0] Final results:", results)

  // Return results in the original order
  return tabulationIdsOrNames
    .map((idOrName) => {
      const tab = results.find(
        (t) => t.id === idOrName || t.name.toLowerCase() === idOrName.toLowerCase()
      )
      return tab || null
    })
    .filter((t): t is { id: string; name: string; description: string } => t !== null)
}

// Import scripts from JSON file
export async function importScriptsFromJson(jsonData: any): Promise<{ productCount: number; stepCount: number }> {
  const supabase = createClient()
  let productCount = 0
  let stepCount = 0

  const marcas = jsonData.marcas || jsonData

  for (const [productName, steps] of Object.entries(marcas)) {
    // Check if product already exists by name
    const { data: existingProducts } = await supabase
      .from(TABLES.PRODUCTS)
      .select("id, details")
      .eq("name", productName)
      .limit(1)

    let productId: string
    let existingDetails: any = null

    if (existingProducts && existingProducts.length > 0) {
      productId = existingProducts[0].id
      existingDetails = existingProducts[0].details
      productCount++

      // Delete existing scripts for this product
      await supabase.from(TABLES.SCRIPTS).delete().eq("product_id", productId)
    } else {
      // Create new product
      const { data: newProduct } = await supabase
        .from(TABLES.PRODUCTS)
        .insert({
          name: productName,
          description: `Produto ${productName}`,
          category: "imported",
          is_active: true,
        })
        .select()
        .single()

      if (!newProduct) continue
      productId = newProduct.id
      productCount++
    }

    // Create all steps and build ID mapping
    const idMapping: Record<string, string> = {}
    const stepsToInsert: any[] = []
    let abordagemOriginalId: string | null = null

    if (typeof steps === "object" && steps !== null) {
      const stepsObj = steps as Record<string, any>
      let order = 0

      for (const [stepKey, stepData] of Object.entries(stepsObj)) {
        order++
        const step = stepData as any

        const originalId = step.id || stepKey
        const stepContent = step.body || step.conteudo || step.content || step.texto || ""
        const stepTitle = step.title || step.titulo || stepKey

        // Identify the "Abordagem" step (first step or one containing "abordagem" in id/title)
        if (!abordagemOriginalId) {
          const isAbordagem = 
            originalId.toLowerCase().includes("abordagem") || 
            stepTitle.toLowerCase().includes("abordagem") ||
            stepKey.toLowerCase().includes("abordagem") ||
            order === 1 // First step is considered abordagem if none explicitly named
          
          if (isAbordagem) {
            abordagemOriginalId = originalId
          }
        }

        // Get tabulation IDs from JSON (supports multiple field names)
        // Can be: tabulacao, tabulacoes, tabulations, or tabulation_ids
        const rawTabulationIds = 
          step.tabulacao || 
          step.tabulacoes || 
          step.tabulations || 
          step.tabulation_ids || 
          []
        
        // Normalize to array of IDs
        const tabulationIds: string[] = Array.isArray(rawTabulationIds) 
          ? rawTabulationIds 
          : (rawTabulationIds ? [rawTabulationIds] : [])

        // If tabulations is already an array of objects with id/name/description, use it directly
        // Otherwise, resolve IDs to full objects
        let resolvedTabulations: Array<{ id: string; name: string; description: string }> = []
        
        if (step.tabulations && Array.isArray(step.tabulations) && step.tabulations.length > 0) {
          // Check if it's already in the full format (has name property)
          if (step.tabulations[0].name) {
            resolvedTabulations = step.tabulations
          } else if (step.tabulations[0].id) {
            // Array of objects with just ID, resolve them
            const ids = step.tabulations.map((t: any) => t.id)
            resolvedTabulations = await resolveTabulationIds(supabase, ids)
          }
        } else if (tabulationIds.length > 0) {
          // Array of string IDs, resolve them
          resolvedTabulations = await resolveTabulationIds(supabase, tabulationIds)
        }

        stepsToInsert.push({
          originalId,
          title: stepTitle,
          content: stepContent,
          product_id: productId,
          product_name: productName,
          step_order: order,
          buttons: step.botoes || step.buttons || [],
          tabulations: resolvedTabulations,
          alert: step.alerta || step.alert || null,
          is_active: true,
        })
      }
    }

    // Insert all steps
    for (const stepData of stepsToInsert) {
      const { originalId, ...insertData } = stepData

      const { data: newStep } = await supabase
        .from(TABLES.SCRIPTS)
        .insert(insertData)
        .select()
        .single()

      if (newStep) {
        idMapping[originalId] = newStep.id
        stepCount++
      }
    }

    // Update all buttons to use new IDs
    for (const [originalId, newId] of Object.entries(idMapping)) {
      const { data: script } = await supabase
        .from(TABLES.SCRIPTS)
        .select("buttons")
        .eq("id", newId)
        .single()

      if (script?.buttons) {
        const updatedButtons = script.buttons.map((btn: any, index: number) => {
          const nextId = btn.next ? idMapping[btn.next] || btn.next : null
          return {
            id: btn.id || `btn-${index}`,
            label: btn.label || btn.text || `Botao ${index + 1}`,
            nextStepId: nextId,
            next: nextId,
            order: btn.order ?? index,
            primary: btn.primary ?? index === 0,
            variant: btn.variant || (index === 0 ? "primary" : "secondary"),
          }
        })

        await supabase.from(TABLES.SCRIPTS).update({ buttons: updatedButtons }).eq("id", newId)
      }
    }

    // Auto-configure the product with the scriptId (Abordagem step)
    if (abordagemOriginalId && idMapping[abordagemOriginalId]) {
      const scriptId = idMapping[abordagemOriginalId]
      
      // Preserve existing details (attendanceTypes, personTypes) if they exist
      const updatedDetails = {
        ...(existingDetails || {}),
        scriptId: scriptId,
      }

      await supabase
        .from(TABLES.PRODUCTS)
        .update({ details: updatedDetails })
        .eq("id", productId)
    }
  }

  // Atualizar versão dos dados para invalidar cache dos operadores
  await updateDataVersion("products")
  await updateDataVersion("scripts")

  return { productCount, stepCount }
}

// Bulk import tabulations
export async function importTabulationsFromJson(tabulationsData: any[]): Promise<number> {
  const supabase = createClient()
  let count = 0

  for (const tab of tabulationsData) {
    const { error } = await supabase.from(TABLES.TABULATIONS).insert({
      name: tab.name || tab.nome,
      description: tab.description || tab.descricao || "",
      color: tab.color || tab.cor || "#6b7280",
      is_active: true,
    })

    if (!error) count++
  }

  // Atualizar versão dos dados
  await updateDataVersion("tabulations")

  return count
}

// Bulk import situations
export async function importSituationsFromJson(situationsData: any[]): Promise<number> {
  const supabase = createClient()
  let count = 0

  for (const sit of situationsData) {
    const { error } = await supabase.from(TABLES.SITUATIONS).insert({
      name: sit.name || sit.nome,
      description: sit.description || sit.descricao || "",
      color: sit.color || sit.cor || "#6b7280",
      is_active: true,
    })

    if (!error) count++
  }

  // Atualizar versão dos dados
  await updateDataVersion("situations")

  return count
}

// Delete all scripts for a product
export async function deleteScriptsForProduct(productId: string): Promise<void> {
  const supabase = createClient()

  // Delete scripts
  await supabase.from(TABLES.SCRIPTS).delete().eq("product_id", productId)

  // Delete product
  await supabase.from(TABLES.PRODUCTS).delete().eq("id", productId)

  // Atualizar versão dos dados
  await updateDataVersion("products")
  await updateDataVersion("scripts")
}

// Delete all scripts for a product by name
export async function deleteScriptsForProductByName(productName: string): Promise<void> {
  const supabase = createClient()

  const { data: products } = await supabase
    .from(TABLES.PRODUCTS)
    .select("id")
    .eq("name", productName)
    .limit(1)

  if (products && products.length > 0) {
    await deleteScriptsForProduct(products[0].id)
  }
}

// Messages hook for operator messages with polling
export function useMessages(userId?: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: messages, error } = await supabase
      .from(TABLES.MESSAGES)
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && messages) {
      setData(messages)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()

    // Polling ao invés de realtime
    const interval = setInterval(fetchData, POLLING_INTERVAL)

    return () => {
      clearInterval(interval)
    }
  }, [fetchData])

  const markAsSeen = async (messageId: string) => {
    if (!userId) return
    const message = data.find((m) => m.id === messageId)
    if (!message) return

    const seenBy = message.seen_by || []
    if (!seenBy.includes(userId)) {
      const supabase = createClient()
      await supabase
        .from(TABLES.MESSAGES)
        .update({ seen_by: [...seenBy, userId] })
        .eq("id", messageId)
      fetchData()
    }
  }

  const create = async (messageData: any) => {
    const supabase = createClient()
    const { error } = await supabase.from(TABLES.MESSAGES).insert(messageData)
    if (error) return { error: error.message }
    fetchData()
    return { error: null }
  }

  const update = async (id: string, updates: any) => {
    const supabase = createClient()
    const { error } = await supabase
      .from(TABLES.MESSAGES)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) return { error: error.message }
    fetchData()
    return { error: null }
  }

  const remove = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from(TABLES.MESSAGES).delete().eq("id", id)
    if (error) return { error: error.message }
    fetchData()
    return { error: null }
  }

  return { data, loading, refetch: fetchData, markAsSeen, create, update, remove }
}

// Quizzes hook with polling
export function useQuizzes(userId?: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: quizzes, error } = await supabase
      .from(TABLES.QUIZZES)
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && quizzes) {
      setData(quizzes)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()

    // Polling ao invés de realtime
    const interval = setInterval(fetchData, POLLING_INTERVAL)

    return () => {
      clearInterval(interval)
    }
  }, [fetchData])

  const create = async (quizData: any) => {
    const supabase = createClient()
    const { error } = await supabase.from(TABLES.QUIZZES).insert(quizData)
    if (error) return { error: error.message }
    fetchData()
    return { error: null }
  }

  const update = async (id: string, updates: any) => {
    const supabase = createClient()
    const { error } = await supabase
      .from(TABLES.QUIZZES)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) return { error: error.message }
    fetchData()
    return { error: null }
  }

  const remove = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from(TABLES.QUIZZES).delete().eq("id", id)
    if (error) return { error: error.message }
    fetchData()
    return { error: null }
  }

  const submitAttempt = async (quizId: string, answer: string, isCorrect: boolean) => {
    if (!userId) return { error: "User not logged in" }
    const supabase = createClient()
    const { error } = await supabase.from("quiz_attempts").insert({
      quiz_id: quizId,
      user_id: userId,
      answer,
      is_correct: isCorrect,
      created_at: new Date().toISOString()
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  const getAttempts = async (quizId: string) => {
    if (!userId) return []
    const supabase = createClient()
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("quiz_id", quizId)
      .eq("user_id", userId)
    return attempts || []
  }

  return { data, loading, refetch: fetchData, create, update, remove, submitAttempt, getAttempts }
}

// Presentations hook with polling
export function usePresentations() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: presentations, error } = await supabase
      .from(TABLES.PRESENTATIONS)
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && presentations) {
      setData(presentations)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()

    // Polling ao invés de realtime
    const interval = setInterval(fetchData, POLLING_INTERVAL)

    return () => {
      clearInterval(interval)
    }
  }, [fetchData])

  const create = async (presentationData: any) => {
    const supabase = createClient()
    const { data: result, error } = await supabase
      .from(TABLES.PRESENTATIONS)
      .insert(presentationData)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    fetchData()
    return { data: result, error: null }
  }

  const update = async (id: string, updates: any) => {
    const supabase = createClient()
    const { error } = await supabase
      .from(TABLES.PRESENTATIONS)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) return { error: error.message }
    fetchData()
    return { error: null }
  }

  const remove = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from(TABLES.PRESENTATIONS).delete().eq("id", id)
    if (error) return { error: error.message }
    fetchData()
    return { error: null }
  }

  return { data, loading, refetch: fetchData, create, update, remove }
}

// Supervisor teams hook
export function useSupervisorTeams() {
  return useSupabaseTable<{
    id: string
    supervisor_id: string
    operator_ids: string[]
    created_at: string
    updated_at: string
  }>(TABLES.SUPERVISOR_TEAMS)
}

// Feedbacks hook for operators with polling
export function useFeedbacksForOperator(userId?: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!userId) {
      setData([])
      setLoading(false)
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: feedbacks, error } = await supabase
      .from(TABLES.FEEDBACKS)
      .select("*")
      .eq("operator_id", userId)
      .order("created_at", { ascending: false })

    if (!error && feedbacks) {
      setData(feedbacks)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchData()

    // Polling ao invés de realtime
    const interval = setInterval(fetchData, POLLING_INTERVAL)

    return () => {
      clearInterval(interval)
    }
  }, [fetchData])

  const markAsRead = async (feedbackId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from(TABLES.FEEDBACKS)
      .update({ is_read: true })
      .eq("id", feedbackId)
    if (error) return { error: error.message }
    fetchData()
    return { error: null }
  }

  return { data, loading, refetch: fetchData, markAsRead }
}
