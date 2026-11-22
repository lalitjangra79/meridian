import { useEffect, useRef } from 'react'

/*
  Global single keys and "g then x" sequences. Ignored while typing in a
  field or when a modifier is held.
*/
export type HotkeyMap = Record<string, () => void>

function typing(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

export function useHotkeys(map: HotkeyMap) {
  const ref = useRef(map)
  ref.current = map
  useEffect(() => {
    let pending: string | null = null
    let timer = 0
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || e.defaultPrevented) return
      if (document.querySelector('[aria-modal="true"]') && e.key !== '?') return
      const key = e.key
      if (pending) {
        const combo = `${pending} ${key.toLowerCase()}`
        pending = null
        window.clearTimeout(timer)
        if (ref.current[combo]) {
          e.preventDefault()
          ref.current[combo]!()
        }
        return
      }
      if (key === 'g') {
        pending = 'g'
        timer = window.setTimeout(() => (pending = null), 1200)
        return
      }
      const fn = ref.current[key]
      if (fn) {
        e.preventDefault()
        fn()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(timer)
    }
  }, [])
}
