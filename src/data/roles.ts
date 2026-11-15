export type UserRole = 'owner' | 'reception' | 'trainer' | 'member' | 'maintenance'

export const roleOrder: UserRole[] = ['owner', 'reception', 'trainer', 'member', 'maintenance']

export const roleLabels: Record<UserRole, string> = {
  owner: 'Dueño del gimnasio',
  reception: 'Personal de recepción',
  trainer: 'Entrenador / Instructor',
  member: 'Socio',
  maintenance: 'Personal de mantenimiento',
}

export const roleNavigation: Record<UserRole, string[]> = {
  owner: ['dashboard', 'members', 'memberships', 'payments', 'classes', 'trainers', 'maintenance', 'finances', 'reports', 'staff'],
  reception: ['dashboard', 'members', 'memberships', 'payments', 'classes'],
  trainer: ['dashboard', 'classes', 'trainers'],
  member: ['dashboard', 'memberships', 'payments', 'classes', 'trainers'],
  maintenance: ['dashboard', 'maintenance'],
}

export const roleHome: Record<UserRole, { action: string; module: string }> = {
  owner: { action: 'Nuevo socio', module: 'members' },
  reception: { action: 'Registrar socio', module: 'members' },
  trainer: { action: 'Ver mis clases', module: 'classes' },
  member: { action: 'Reservar clase', module: 'classes' },
  maintenance: { action: 'Registrar incidencia', module: 'maintenance' },
}
