import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'

import {
  AGENTS,
  DECISIONS,
  DEFAULT_RANGE,
  MODELS,
  RUNS,
  lossCurve,
  type Agent,
  type AutonomyLevel,
  type Decision,
  type Model,
  type ModelStage,
  type Range,
  type Run,
} from '../data'
import { usePersistentState } from './storage'

/*
  Console state in one context. Everything the operator changes — autonomy
  policy, model stages, agent pauses, approvals, locally launched runs — is
  persisted to localStorage under "meridian:".
*/

export type Settings = {
  /** Minimum decision confidence the platform will execute without a human. */
  confidenceFloor: number
  /** Spend above this always waits for a human, whatever the confidence. */
  approvalLimit: number
  /** Tier-1 models need a second approver. */
  dualControl: boolean
  /** Pause an agent automatically when its model drifts past policy. */
  autoFreeze: boolean
}

export const DEFAULT_SETTINGS: Settings = { confidenceFloor: 0.9, approvalLimit: 250_000, dualControl: true, autoFreeze: true }

export type LiveAgent = Agent & { autonomy: AutonomyLevel; paused: boolean }

type LaunchInput = {
  modelId: string
  objective: string
  epochs: number
  compute: number
  /** Real evaluation evidence from the ML engine, when the run was trained there. */
  result?: { id: string; accuracy: number; loss: number[]; samples: number }
}

type Store = {
  models: Model[]
  agents: LiveAgent[]
  decisions: Decision[]
  runs: Run[]
  settings: Settings
  range: Range
  setRange: (r: Range) => void
  setSettings: (next: Settings) => void
  setConfidenceFloor: (v: number) => void
  setApprovalLimit: (v: number) => void
  setDualControl: (v: boolean) => void
  setAutoFreeze: (v: boolean) => void
  resetSettings: () => void
  setStage: (modelId: string, stage: ModelStage) => void
  setAutonomy: (agentId: string, level: AutonomyLevel) => void
  toggleAgent: (agentId: string) => void
  approve: (decisionId: string) => void
  approveAll: () => void
  launchRun: (input: LaunchInput) => Run
}

const Ctx = createContext<Store | null>(null)

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside <StoreProvider>')
  return s
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [autonomy, setAutonomyMap] = usePersistentState<Record<string, AutonomyLevel>>('autonomy', {})
  const [paused, setPaused] = usePersistentState<Record<string, boolean>>('paused', {})
  const [stages, setStages] = usePersistentState<Record<string, ModelStage>>('stages', {})
  const [approved, setApproved] = usePersistentState<string[]>('approved', [])
  const [settings, setSettings] = usePersistentState<Settings>('policy', DEFAULT_SETTINGS)
  const [range, setRange] = usePersistentState<Range>('range', DEFAULT_RANGE)
  const [launched, setLaunched] = usePersistentState<Run[]>('runs', [])

  const models = useMemo(
    () => MODELS.map((m) => (stages[m.id] && stages[m.id] !== m.stage ? { ...m, stage: stages[m.id]! } : m)),
    [stages],
  )

  const agents = useMemo<LiveAgent[]>(
    () => AGENTS.map((a) => ({ ...a, autonomy: autonomy[a.id] ?? a.defaultAutonomy, paused: paused[a.id] ?? false })),
    [autonomy, paused],
  )

  const decisions = useMemo(
    () =>
      DECISIONS.map((d) => (approved.includes(d.id) ? { ...d, outcome: 'Approved' as const } : d)),
    [approved],
  )

  const runs = useMemo(() => [...launched, ...RUNS], [launched])

  const approve = useCallback(
    (decisionId: string) => setApproved((list) => (list.includes(decisionId) ? list : [...list, decisionId])),
    [setApproved],
  )

  const approveAll = useCallback(
    () => setApproved((list) => [...new Set([...list, ...DECISIONS.filter((d) => d.outcome === 'Awaiting approval').map((d) => d.id)])]),
    [setApproved],
  )

  const launchRun = useCallback(
    (input: LaunchInput) => {
      const model = MODELS.find((m) => m.id === input.modelId) ?? MODELS[0]!
      // A run trained by the ML engine carries its own id, accuracy and loss
      // curve; nothing here invents them.
      const id = input.result?.id ?? `run-${Date.now().toString().slice(-5)}`
      const run: Run = {
        id,
        modelId: model.id,
        objective: input.objective,
        status: 'Succeeded',
        started: 'Just now',
        duration: `${Math.max(1, Math.round(input.compute / 6))}h ${10 + (input.epochs % 50)}m`,
        epochs: input.epochs,
        compute: input.compute,
        cost: Math.round(input.compute * 80),
        accuracy: input.result ? input.result.accuracy : Math.min(0.999, Math.round((model.accuracy + (input.epochs > 80 ? 0.004 : 0.001)) * 1000) / 1000),
        owner: 'You',
        commit: input.result ? `${input.result.samples} rows` : Math.random().toString(16).slice(2, 9),
        loss: input.result ? input.result.loss : lossCurve(Date.now() % 9973, 26, 1.9, 0.2),
      }
      setLaunched((list) => [run, ...list])
      return run
    },
    [setLaunched],
  )

  const store: Store = {
    models,
    agents,
    decisions,
    runs,
    settings,
    range,
    setRange,
    setSettings,
    setConfidenceFloor: (v) => setSettings((s) => ({ ...s, confidenceFloor: v })),
    setApprovalLimit: (v) => setSettings((s) => ({ ...s, approvalLimit: v })),
    setDualControl: (v) => setSettings((s) => ({ ...s, dualControl: v })),
    setAutoFreeze: (v) => setSettings((s) => ({ ...s, autoFreeze: v })),
    resetSettings: () => setSettings(DEFAULT_SETTINGS),
    setStage: (modelId, stage) => setStages((m) => ({ ...m, [modelId]: stage })),
    setAutonomy: (agentId, level) => setAutonomyMap((m) => ({ ...m, [agentId]: level })),
    toggleAgent: (agentId) => setPaused((m) => ({ ...m, [agentId]: !m[agentId] })),
    approve,
    approveAll,
    launchRun,
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}
