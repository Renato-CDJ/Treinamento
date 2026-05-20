"use client"

import { useRef, useEffect, useMemo, type ElementType } from "react"

// Sanitize HTML to remove script tags and other dangerous elements
function sanitizeHtml(html: string): string {
  if (!html) return ""
  // Remove script tags and their content
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<script[^>]*>/gi, "")
    .replace(/<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // Remove inline event handlers
    .replace(/javascript:/gi, "") // Remove javascript: URLs
}

interface SafeHtmlProps {
  html: string
  className?: string
  as?: ElementType
}

export function SafeHtml({ html, className, as: Component = "div" }: SafeHtmlProps) {
  const ref = useRef<HTMLElement>(null)
  const sanitized = useMemo(() => sanitizeHtml(html), [html])
  
  // Use useEffect to set innerHTML after mount, avoiding React's script tag warning
  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = sanitized
    }
  }, [sanitized])
  
  // @ts-ignore - dynamic component type
  return <Component ref={ref} className={className} />
}
