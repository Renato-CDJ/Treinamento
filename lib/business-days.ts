// Brazilian national holidays for 2025 and 2026
const HOLIDAYS_2025 = [
  new Date(2025, 0, 1), // Ano Novo
  new Date(2025, 1, 17), // Carnaval
  new Date(2025, 1, 18), // Carnaval
  new Date(2025, 3, 18), // Sexta-feira Santa
  new Date(2025, 3, 21), // Tiradentes
  new Date(2025, 4, 1), // Dia do Trabalho
  new Date(2025, 5, 19), // Corpus Christi
  new Date(2025, 8, 7), // Independência
  new Date(2025, 9, 12), // Nossa Senhora Aparecida
  new Date(2025, 10, 2), // Finados
  new Date(2025, 10, 15), // Proclamação da República
  new Date(2025, 11, 25), // Natal
]

const HOLIDAYS_2026 = [
  new Date(2026, 0, 1), // Ano Novo
  new Date(2026, 1, 16), // Carnaval
  new Date(2026, 1, 17), // Carnaval
  new Date(2026, 3, 3), // Sexta-feira Santa
  new Date(2026, 3, 21), // Tiradentes
  new Date(2026, 4, 1), // Dia do Trabalho
  new Date(2026, 5, 4), // Corpus Christi
  new Date(2026, 8, 7), // Independência
  new Date(2026, 9, 12), // Nossa Senhora Aparecida
  new Date(2026, 10, 2), // Finados
  new Date(2026, 10, 15), // Proclamação da República
  new Date(2026, 11, 25), // Natal
]

const ALL_HOLIDAYS = [...HOLIDAYS_2025, ...HOLIDAYS_2026]

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday or Saturday
}

export function isSaturday(date: Date): boolean {
  return date.getDay() === 6
}

export function isSunday(date: Date): boolean {
  return date.getDay() === 0
}

export function isHoliday(date: Date): boolean {
  return ALL_HOLIDAYS.some(
    (holiday) =>
      holiday.getDate() === date.getDate() &&
      holiday.getMonth() === date.getMonth() &&
      holiday.getFullYear() === date.getFullYear(),
  )
}

export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date)
}

/**
 * Verifica se a data é um dia não útil (sábado, domingo ou feriado)
 */
export function isNonBusinessDay(date: Date): boolean {
  return isWeekend(date) || isHoliday(date)
}

/**
 * Retorna o dia útil anterior a uma data
 * Se a data já for um dia útil, retorna ela mesma
 */
export function getPreviousBusinessDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  
  while (isNonBusinessDay(result)) {
    result.setDate(result.getDate() - 1)
  }
  
  return result
}

/**
 * Retorna o próximo dia útil após uma data
 * Se a data já for um dia útil, retorna ela mesma
 */
export function getNextBusinessDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  
  while (isNonBusinessDay(result)) {
    result.setDate(result.getDate() + 1)
  }
  
  return result
}

export function addBusinessDays(startDate: Date, businessDays: number): Date {
  const currentDate = new Date(startDate)
  let daysAdded = 0

  while (daysAdded < businessDays) {
    currentDate.setDate(currentDate.getDate() + 1)

    if (isBusinessDay(currentDate)) {
      daysAdded++
    }
  }

  return currentDate
}

/**
 * Calcula a data máxima de promessa baseada no tipo de produto
 * - Habitacional e Comercial: D+9 (dia atual + 9 dias corridos, pulando feriados nacionais)
 * - Cartão: D+6 (dia atual + 6 dias corridos, pulando feriados nacionais)
 * 
 * REGRAS ATUALIZADAS:
 * - Contagem em dias corridos (inclui sábados e domingos na contagem)
 * - Sábados, domingos e feriados são pulados na contagem, mas se a data final cair neles,
 *   retorna o dia útil ANTERIOR como prazo limite para informar ao cliente
 * - Se o contato for no sábado, conta como dia D
 */
export function getMaxPromiseDate(productType: "cartao" | "comercial" | "habitacional"): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // D+6 para Cartão, D+9 para Habitacional e Comercial
  const daysToAdd = productType === "cartao" ? 6 : 9

  const maxDate = new Date(today)
  let daysAdded = 0

  // Conta dias corridos a partir de hoje, pulando apenas feriados nacionais
  while (daysAdded < daysToAdd) {
    maxDate.setDate(maxDate.getDate() + 1)
    // Só pula feriados nacionais (finais de semana contam normalmente na contagem)
    if (!isHoliday(maxDate)) {
      daysAdded++
    }
  }

  // Se a data máxima cair em sábado, domingo ou feriado,
  // retorna o dia útil anterior como prazo limite
  if (isNonBusinessDay(maxDate)) {
    return getPreviousBusinessDay(maxDate)
  }

  return maxDate
}
