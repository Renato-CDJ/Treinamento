// Utility to load scripts from the /data/scripts folder

import { importScriptFromJson } from "./store"

/**
 * Loads all JSON script files from the /data/scripts folder
 * This function should be called during app initialization
 */
export async function loadScriptsFromFolder(): Promise<{
  success: boolean
  filesLoaded: number
  totalSteps: number
  totalProducts: number
  errors: string[]
}> {
  const result = {
    success: true,
    filesLoaded: 0,
    totalSteps: 0,
    totalProducts: 0,
    errors: [] as string[],
  }

  try {
    // In a real implementation, this would read files from the /data/scripts folder
    // For now, we'll provide a way to manually trigger loading via the UI

    // This is a placeholder - in production, you would use Node.js fs module
    // or a build-time script to load these files

    console.log("[v0] Scripts loader initialized. Place JSON files in /data/scripts folder.")

    return result
  } catch (error) {
    result.success = false
    result.errors.push(error instanceof Error ? error.message : "Unknown error")
    return result
  }
}

/**
 * Loads a single JSON file and imports its scripts
 */
export function loadScriptFile(jsonData: any): {
  productCount: number
  stepCount: number
  error?: string
} {
  try {
    const result = importScriptFromJson(jsonData)
    return {
      productCount: result.productCount,
      stepCount: result.stepCount,
    }
  } catch (error) {
    return {
      productCount: 0,
      stepCount: 0,
      error: error instanceof Error ? error.message : "Erro ao carregar script",
    }
  }
}

/**
 * Validates if a JSON file has the correct structure for scripts
 */
export function validateScriptJson(jsonData: any): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!jsonData) {
    errors.push("JSON vazio ou inválido")
    return { valid: false, errors }
  }

  if (!jsonData.marcas) {
    errors.push("Propriedade 'marcas' não encontrada")
    return { valid: false, errors }
  }

  if (typeof jsonData.marcas !== "object") {
    errors.push("'marcas' deve ser um objeto")
    return { valid: false, errors }
  }

  const productNames = Object.keys(jsonData.marcas)
  if (productNames.length === 0) {
    errors.push("Nenhum produto encontrado em 'marcas'")
    return { valid: false, errors }
  }

  // Validate each product has steps
  for (const productName of productNames) {
    const steps = jsonData.marcas[productName]
    if (typeof steps !== "object" || Object.keys(steps).length === 0) {
      errors.push(`Produto '${productName}' não possui telas válidas`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
