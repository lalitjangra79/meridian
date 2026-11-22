import { useCallback, useEffect, useRef, useState } from 'react'

const PREFIX = 'meridian:'

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* private mode or quota: state just won't persist */
  }
}

/** useState that persists to localStorage under `meridian:<key>`. */
export function usePersistentState<T>(key: string, initial: T | (() => T)) {
  const [value, setValue] = useState<T>(() => load(key, typeof initial === 'function' ? (initial as () => T)() : initial))
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    save(key, value)
  }, [key, value])
  const reset = useCallback(() => setValue(typeof initial === 'function' ? (initial as () => T)() : initial), [initial])
  return [value, setValue, reset] as const
}
