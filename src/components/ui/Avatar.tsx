export function Avatar({ initials, color = 'coral', size = 'md' }: { initials: string; color?: string; size?: 'sm' | 'md' | 'lg' }) {
  return <span className={`avatar avatar-${color} avatar-${size}`}>{initials}</span>
}
