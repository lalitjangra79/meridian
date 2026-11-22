import { useCallback, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'
const KEY = 'meridian-theme'

/** Theme lives on <html data-theme>; the swap animates every token for ~500ms. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  )

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f5f0e9' : '#110b09')
  }, [theme])

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    const root = document.documentElement
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduce) {
      root.classList.add('theme-anim')
      window.setTimeout(() => root.classList.remove('theme-anim'), 650)
    }
    root.dataset.theme = next
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* private mode: the theme just won't persist */
    }
    setTheme(next)
  }, [theme])

  return { theme, toggle }
}
