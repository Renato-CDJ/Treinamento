'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Suppress the script tag warning from next-themes after mount
  React.useEffect(() => {
    const originalError = console.error
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) {
        return // Suppress this specific warning
      }
      originalError.apply(console, args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  // Render children immediately but with suppressHydrationWarning handled by parent
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
