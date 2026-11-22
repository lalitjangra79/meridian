import { useSyncExternalStore } from 'react'

/*
  prefers-reduced-motion as a live boolean. (Motion's own hook works too, but
  it logs a dev warning whenever the preference is on.)
*/
const query = '(prefers-reduced-motion: reduce)'

function subscribe(cb: () => void) {
  const mq = window.matchMedia(query)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}
