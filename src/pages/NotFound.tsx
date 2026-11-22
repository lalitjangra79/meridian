import { EmptyState } from '../components/EmptyState'
import { Pill } from '../components/Pill'
import { navigate } from '../lib/router'

export function NotFound() {
  return (
    <div className="mt-10">
      <EmptyState title="No such console view" action={<Pill variant="outline" onClick={() => navigate('/')}>Back to command center</Pill>}>
        The page you asked for is not part of this console. Every model, agent and decision lives in the six views in the top bar.
      </EmptyState>
    </div>
  )
}
