import { useEffect, useRef, useState } from 'react'

/** Tracks an element's content width (for responsive SVG charts). */
export function useWidth<T extends HTMLElement>(initial = 800) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(initial)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(Math.round(el.getBoundingClientRect().width))
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e!.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}
