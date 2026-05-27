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
 * - Habitacional e Comercial: 10 dias corridos a partir de hoje
 * - Cartão: 7 dias corridos a partir de hoje
 * 
 * REGRAS:
 * - Contagem em dias corridos (inclui sábados, domingos e feriados)
 * - Hoje conta como dia 1
 */
export function getMaxPromiseDate(productType: "cartao" | "comercial" | "habitacional"): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // 10 dias corridos para Habitacional/Comercial (hoje + 9), 7 dias para Cartão (hoje + 6)
  const daysToAdd = productType === "cartao" ? 6 : 9

  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + daysToAdd)

  return maxDate
}
