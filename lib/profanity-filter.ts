// Profanity filter for Portuguese content
// List of common profane words in Portuguese (censored for code readability)

const profaneWords = [
  // Common profanity
  "merda", "porra", "caralho", "foda", "fodase", "foda-se", "puta", "putaria",
  "cacete", "buceta", "cu", "cuzao", "cuzão", "viado", "viada", "vagabunda",
  "vagabundo", "arrombado", "arrombada", "desgraça", "desgraca", "filho da puta",
  "fdp", "pqp", "vsf", "tnc", "krl", "porra", "bosta", "cagar", "cagado",
  "cagada", "piroca", "rola", "pau", "boceta", "xoxota", "punheta", "safado",
  "safada", "vadia", "vadio", "otario", "otária", "idiota", "imbecil", "babaca",
  "trouxa", "corno", "corna", "piranha", "galinha", "vaca", "burro", "burra",
  // Variations and slang
  "pqp", "vsf", "tnc", "plmds", "puta q pariu", "vai se foder", "tomar no cu",
  "filho duma egua", "égua", "caramba", "droga", "raios", "inferno",
]

// Create regex patterns for each word
const profanePatterns = profaneWords.map(word => {
  // Escape special regex characters and create word boundary pattern
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Match with variations (numbers replacing letters, etc)
  const withVariations = escaped
    .replace(/a/gi, '[a@4]')
    .replace(/e/gi, '[e3]')
    .replace(/i/gi, '[i1!]')
    .replace(/o/gi, '[o0]')
    .replace(/u/gi, '[u]')
    .replace(/s/gi, '[s$5]')
  return new RegExp(`\\b${withVariations}\\b`, 'gi')
})

export function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase()
  return profanePatterns.some(pattern => pattern.test(lowerText))
}

export function filterProfanity(text: string): string {
  let filtered = text
  profanePatterns.forEach((pattern, index) => {
    const word = profaneWords[index]
    const replacement = word.charAt(0) + '*'.repeat(word.length - 1)
    filtered = filtered.replace(pattern, replacement)
  })
  return filtered
}

export function getProfanityWarning(): string {
  return "Sua mensagem contém palavras inadequadas. Por favor, revise o conteúdo antes de publicar."
}
