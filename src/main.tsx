import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { MotionConfig, MotionGlobalConfig } from 'motion/react'

import { App } from './App'
import './styles.css'

// Reduced motion: every Motion animation completes instantly (CSS animations
// are cut in styles.css). MotionConfig "never" stops Motion second-guessing
// this per component, since the app already handles the preference here.
const rm = window.matchMedia('(prefers-reduced-motion: reduce)')
MotionGlobalConfig.instantAnimations = rm.matches
rm.addEventListener('change', (e) => (MotionGlobalConfig.instantAnimations = e.matches))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="never">
      <App />
    </MotionConfig>
  </StrictMode>,
)
