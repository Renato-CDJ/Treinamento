'use client'

import { useEffect, useRef } from 'react'
import { initializeDefaultData } from '@/lib/initialize-storage'

export function InitializeStorage() {
  const initializedRef = useRef(false)
  
  useEffect(() => {
    // Evita execucao duplicada em StrictMode
    if (initializedRef.current) return
    initializedRef.current = true
    
    // Executa com delay minimo para nao bloquear render
    const timer = setTimeout(() => {
      initializeDefaultData()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  return null
}
