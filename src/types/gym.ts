export type IconName =
  | 'grid'
  | 'users'
  | 'card'
  | 'wallet'
  | 'calendar'
  | 'trainer'
  | 'tool'
  | 'chart'
  | 'report'
  | 'search'
  | 'bell'
  | 'plus'
  | 'arrow'
  | 'check'
  | 'clock'
  | 'warning'
  | 'logout'
  | 'chevron'
  | 'close'
  | 'menu'

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

export interface Member {
  id: string
  name: string
  initials: string
  plan: string
  expires: string
  status: 'Vigente' | 'Por vencer' | 'Vencida'
  lastVisit: string
  email: string
  color: string
}

export interface OperationModule {
  title: string
  eyebrow: string
  description: string
  icon: IconName
  primaryAction: string
  stats: Array<{ label: string; value: string; detail: string; tone?: StatusTone }>
  columns: string[]
  rows: Array<{ cells: string[]; status: string; tone: StatusTone }>
}
