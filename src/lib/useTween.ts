import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'


/** Eases a number toward `target` (count-up on mount, glide on change). */
export function useTween(target: number, duration = 700, from = 0): number {
  const reduce = useReducedMotion()
  const [value, setValue] = useState(reduce ? target : from)
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    if (reduce) {
      setValue(target)
      return
    }
    const start = valueRef.current
    if (start === target) return
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration)
      const e = 1 - Math.pow(1 - t, 3)
      setValue(start + (target - start) * e)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, reduce])

  return value
}
