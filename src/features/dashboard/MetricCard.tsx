import { Icon } from '../../components/ui/Icon'
import type { IconName, StatusTone } from '../../types/gym'

export function MetricCard({ label, value, detail, icon, tone = 'neutral', action }: { label: string; value: string; detail: string; icon: IconName; tone?: StatusTone; action?: () => void }) {
  return (
    <button className="metric-card" onClick={action}>
      <span className={`metric-icon metric-${tone}`}><Icon name={icon} /></span>
      <span className="metric-copy"><small>{label}</small><strong>{value}</strong><span>{detail}</span></span>
      <Icon name="arrow" className="metric-arrow" size={18} />
    </button>
  )
}
