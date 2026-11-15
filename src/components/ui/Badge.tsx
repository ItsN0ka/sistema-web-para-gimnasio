import type { StatusTone } from '../../types/gym'

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: StatusTone }) {
  return <span className={`badge badge-${tone}`}><span className="badge-dot" />{children}</span>
}
