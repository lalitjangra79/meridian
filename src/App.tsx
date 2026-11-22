import { useCallback, useEffect, useRef, useState } from 'react'

import { Footer } from './app/Footer'
import { Header } from './app/Header'
import { MobileNav } from './app/MobileNav'
import { ShortcutsHelp } from './app/ShortcutsHelp'
import { TopNav } from './app/TopNav'
import { ToastProvider } from './components/Toast'
import { copy } from './data'
import { useHotkeys } from './lib/hotkeys'
import { match, navigate, usePath, useRouteEffects, type Route } from './lib/router'
import { StoreProvider, useStore } from './lib/store'
import { useTheme } from './lib/theme'
import { Agents } from './pages/Agents'
import { Data } from './pages/Data'
import { Governance } from './pages/Governance'
import { Models } from './pages/Models'
import { NotFound } from './pages/NotFound'
import { Overview } from './pages/Overview'
import { Training } from './pages/Training'

const TITLES: Record<Route['name'], string> = {
  overview: 'Command center',
  models: 'Models',
  training: 'Training',
  data: 'Data',
  agents: 'Agents',
  governance: 'Governance',
  'not-found': 'Not found',
}

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'overview':
      return <Overview />
    case 'models':
      return <Models />
    case 'training':
      return <Training />
    case 'data':
      return <Data />
    case 'agents':
      return <Agents />
    case 'governance':
      return <Governance />
    default:
      return <NotFound />
  }
}

function Shell() {
  const { theme, toggle } = useTheme()
  const { models, agents } = useStore()
  const path = usePath()
  const route = match(path)
  const [helpOpen, setHelpOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const title = route.name === 'overview' ? copy.title : `${TITLES[route.name]} · ${copy.title}`
  useRouteEffects(path, title)

  // Move focus to the new page's title after client-side navigation (not on first load).
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const t = window.setTimeout(() => {
      const a = document.activeElement
      if (a && a !== document.body && a.closest('main') && a.matches('input,textarea,select')) return
      document.querySelector<HTMLElement>('[data-page-title]')?.focus({ preventScroll: true })
    }, 60)
    return () => window.clearTimeout(t)
  }, [path])

  useHotkeys({
    'g c': () => navigate('/'),
    'g m': () => navigate('/models'),
    'g t': () => navigate('/training'),
    'g d': () => navigate('/data'),
    'g a': () => navigate('/agents'),
    'g g': () => navigate('/governance'),
    '/': () => {
      if (match(window.location.pathname).name !== 'models') navigate('/models')
      window.setTimeout(() => document.getElementById('model-search')?.focus(), 160)
    },
    t: toggle,
    '?': () => setHelpOpen((o) => !o),
  })

  const closeHelp = useCallback(() => setHelpOpen(false), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <a href="#main" className="caps fixed top-3 left-3 z-[70] pointer-events-none inline-flex min-h-10 -translate-y-16 items-center rounded-full bg-fg px-4 py-2.5 text-[11px] text-bg opacity-0 transition-[translate,opacity] focus-visible:pointer-events-auto focus-visible:translate-y-0 focus-visible:opacity-100">
        Skip to content
      </a>
      <div className="mx-auto w-full max-w-[1304px] px-4 pt-4 sm:px-8 sm:pt-5">
        <TopNav path={path} onOpenMenu={() => setMenuOpen(true)} onOpenShortcuts={() => setHelpOpen(true)} />
      </div>
      <main id="main" className="mx-auto w-full max-w-[1304px] flex-1 px-4 pt-7 pb-16 sm:px-8 sm:pt-[30px] sm:pb-24">
        <Header models={models.filter((m) => m.stage === 'Production').length} agents={agents.filter((a) => !a.paused).length} theme={theme} onToggleTheme={toggle} />
        <div className={route.name === 'overview' ? '' : 'mt-8 sm:mt-10'}>
          <Page route={route} />
        </div>
      </main>
      <Footer onOpenShortcuts={() => setHelpOpen(true)} />

      <ShortcutsHelp open={helpOpen} onClose={closeHelp} />
      <MobileNav open={menuOpen} onClose={closeMenu} path={path} />
    </div>
  )
}

export function App() {
  return (
    <ToastProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </ToastProvider>
  )
}
