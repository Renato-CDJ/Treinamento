'use client'

// Helper function to ensure attendance types exist
function ensureAttendanceTypes() {
  const existing = localStorage.getItem('callcenter_attendance_types')
  if (!existing || existing === '[]') {
    const defaultAttendanceTypes = [
      {
        id: "att-ativo",
        value: "ativo",
        label: "Ativo",
        createdAt: new Date().toISOString(),
      },
      {
        id: "att-receptivo",
        value: "receptivo",
        label: "Receptivo",
        createdAt: new Date().toISOString(),
      },
    ]
    localStorage.setItem('callcenter_attendance_types', JSON.stringify(defaultAttendanceTypes))
  }
}

// Helper function to ensure person types exist
function ensurePersonTypes() {
  const existing = localStorage.getItem('callcenter_person_types')
  if (!existing || existing === '[]') {
    const defaultPersonTypes = [
      {
        id: "per-fisica",
        value: "fisica",
        label: "Física",
        createdAt: new Date().toISOString(),
      },
      {
        id: "per-juridica",
        value: "juridica",
        label: "Jurídica",
        createdAt: new Date().toISOString(),
      },
    ]
    localStorage.setItem('callcenter_person_types', JSON.stringify(defaultPersonTypes))
  }
}

// Script para inicializar localStorage com dados padrão na primeira vez
export function initializeDefaultData() {
  if (typeof window === 'undefined') return

  // Always ensure attendance types and person types exist
  ensureAttendanceTypes()
  ensurePersonTypes()

  const hasInitialized = localStorage.getItem('roteiro_initialized')
  if (hasInitialized) return

  // Usuários padrão
  const defaultUsers = [
    {
      id: '1',
      username: 'admin',
      name: 'Administrador RC',
      password: 'rcp@$',
      role: 'admin',
      admin_type: 'master',
      allowed_tabs: ['dashboard', 'operators', 'quality-center', 'settings', 'products', 'scripts', 'presentations', 'feedback'],
      is_active: true,
    },
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `monitoria-${i + 1}`,
      username: `Monitoria${i + 1}`,
      name: `Monitoria ${i + 1}`,
      password: 'rcp@$',
      role: 'admin',
      admin_type: 'monitoria',
      allowed_tabs: ['dashboard', 'operators', 'quality-center', 'products', 'scripts', 'presentations'],
      is_active: true,
    })),
    ...Array.from({ length: 30 }, (_, i) => ({
      id: `supervisor-${i + 1}`,
      username: `Supervisor${i + 1}`,
      name: `Supervisor ${i + 1}`,
      password: 'rcp@$',
      role: 'admin',
      admin_type: 'supervisao',
      allowed_tabs: ['dashboard', 'quality-center'],
      is_active: true,
    })),
  ]

  localStorage.setItem('roteiro_users', JSON.stringify(defaultUsers))
  localStorage.setItem('roteiro_current_user', JSON.stringify(null))
  localStorage.setItem('roteiro_quality_posts', JSON.stringify([]))
  localStorage.setItem('roteiro_feedbacks', JSON.stringify([]))

  localStorage.setItem('roteiro_initialized', 'true')
}
