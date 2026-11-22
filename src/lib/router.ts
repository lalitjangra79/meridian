import { useEffect, useSyncExternalStore } from 'react'

/*
  A tiny History API router: `usePath()` re-renders on navigation,
  `navigate()` pushes a path. The Worker serves index.html for every
  unknown path (single-page-application mode), so deep links work.
*/

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

if (typeof window !== 'undefined') window.addEventListener('popstate', emit)

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function usePath(): string {
  return useSyncExternalStore(subscribe, () => window.location.pathname, () => '/')
}

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (to === window.location.pathname + window.location.search) return
  if (opts.replace) window.history.replaceState(null, '', to)
  else window.history.pushState(null, '', to)
  emit()
}

export type Route =
  | { name: 'overview' }
  | { name: 'models' }
  | { name: 'training' }
  | { name: 'data' }
  | { name: 'agents' }
  | { name: 'governance' }
  | { name: 'not-found' }

export function match(path: string): Route {
  const p = path.replace(/\/+$/, '') || '/'
  if (p === '/') return { name: 'overview' }
  if (p === '/models') return { name: 'models' }
  if (p === '/training') return { name: 'training' }
  if (p === '/data') return { name: 'data' }
  if (p === '/agents') return { name: 'agents' }
  if (p === '/governance') return { name: 'governance' }
  return { name: 'not-found' }
}

/** Scroll to the top and set the document title on route change. */
export function useRouteEffects(path: string, title: string) {
  useEffect(() => {
    document.title = title
  }, [title])
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [path])
}
