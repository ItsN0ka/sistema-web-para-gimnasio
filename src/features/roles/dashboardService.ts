import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { attendance, members, upcomingClasses } from '../../data/mockData'
import type { UserRole } from '../../data/roles'
import type { IconName, StatusTone } from '../../types/gym'

export interface DashboardMetric {
  label: string
  value: string
  detail: string
  icon: IconName
  tone: StatusTone
  module: string
}

export interface DashboardItem {
  title: string
  detail: string
  status: string
  tone: StatusTone
  module: string
}

export interface DashboardSnapshot {
  description: string
  metrics: DashboardMetric[]
  items: DashboardItem[]
  focus: { title: string; detail: string; module: string }
}

const asDate = (date: Date) => date.toISOString()
const today = () => {
  const start = new Date(); start.setHours(0, 0, 0, 0); return start
}

export async function loadDashboard(role: UserRole, userId: string | null, memberId: string | null): Promise<DashboardSnapshot> {
  if (!isSupabaseConfigured || !supabase) return demoDashboard(role)

  if (role === 'owner') {
    const [membersResult, expiringResult, pendingResult, classResult, expensesResult] = await Promise.all([
      supabase.from('members').select('id,membership_status', { count: 'exact' }),
      supabase.from('members').select('id', { count: 'exact' }).gte('expires_at', today().toISOString().slice(0, 10)).lte('expires_at', new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)),
      supabase.from('payments').select('amount').eq('payment_status', 'Pendiente'),
      supabase.from('gym_classes').select('id,name,trainer_name,starts_at,capacity').gte('starts_at', asDate(today())).lt('starts_at', asDate(new Date(today().getTime() + 86400000))).order('starts_at'),
      supabase.from('operating_expenses').select('amount').gte('paid_at', today().toISOString().slice(0, 7) + '-01'),
    ])
    const failure = [membersResult.error, expiringResult.error, pendingResult.error, classResult.error, expensesResult.error].find(Boolean)
    if (failure) throw failure
    const pendingTotal = (pendingResult.data ?? []).reduce((sum, row) => sum + Number(row.amount), 0)
    const classItems = (classResult.data ?? []).map((row) => ({ title: row.name, detail: `${new Date(row.starts_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} · ${row.trainer_name}`, status: `${row.capacity} cupos`, tone: 'info' as const, module: 'classes' }))
    return {
      description: 'Resumen actualizado de socios, ingresos y operaciones.',
      metrics: [
        { label: 'SOCIOS', value: String(membersResult.count ?? 0), detail: 'Registros activos en el gimnasio', icon: 'users', tone: 'success', module: 'members' },
        { label: 'POR VENCER', value: String(expiringResult.count ?? 0), detail: 'Durante los próximos 7 días', icon: 'clock', tone: 'warning', module: 'members' },
        { label: 'PAGOS PENDIENTES', value: String(pendingResult.data?.length ?? 0), detail: `$${pendingTotal.toLocaleString('es-CL')} por cobrar`, icon: 'warning', tone: 'danger', module: 'payments' },
        { label: 'CLASES HOY', value: String(classResult.data?.length ?? 0), detail: `${expensesResult.data?.length ?? 0} gastos este mes`, icon: 'calendar', tone: 'info', module: 'classes' },
      ],
      items: classItems,
      focus: { title: 'Panel del gimnasio', detail: 'Revisa socios, actividad y pagos registrados.', module: 'reports' },
    }
  }

  if (role === 'reception') {
    const start = today();
    const [visits, expiring, pending, classes] = await Promise.all([
      supabase.from('attendance').select('id', { count: 'exact' }).gte('checked_in_at', asDate(start)),
      supabase.from('members').select('id', { count: 'exact' }).gte('expires_at', start.toISOString().slice(0, 10)).lte('expires_at', new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)),
      supabase.from('payments').select('id,amount').eq('payment_status', 'Pendiente'),
      supabase.from('gym_classes').select('id,name,trainer_name,starts_at,capacity').gte('starts_at', asDate(start)).lt('starts_at', asDate(new Date(start.getTime() + 86400000))).order('starts_at'),
    ])
    const failure = [visits.error, expiring.error, pending.error, classes.error].find(Boolean)
    if (failure) throw failure
    const pendingTotal = (pending.data ?? []).reduce((sum, row) => sum + Number(row.amount), 0)
    return {
      description: 'Gestiona accesos, socios y pagos de hoy.',
      metrics: [
        { label: 'INGRESOS HOY', value: String(visits.count ?? 0), detail: 'Visitas registradas', icon: 'check', tone: 'success', module: 'members' },
        { label: 'POR VENCER', value: String(expiring.count ?? 0), detail: 'Próximos 7 días', icon: 'clock', tone: 'warning', module: 'members' },
        { label: 'PAGOS PENDIENTES', value: String(pending.data?.length ?? 0), detail: `$${pendingTotal.toLocaleString('es-CL')} por cobrar`, icon: 'wallet', tone: 'danger', module: 'payments' },
        { label: 'RESERVAS HOY', value: String(classes.data?.length ?? 0), detail: 'Clases programadas', icon: 'calendar', tone: 'info', module: 'classes' },
      ],
      items: (classes.data ?? []).map((row) => ({ title: row.name, detail: `${new Date(row.starts_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} · ${row.trainer_name}`, status: `${row.capacity} cupos`, tone: 'info', module: 'classes' })),
      focus: { title: 'Accesos y atención', detail: 'Registra socios, visitas y pagos desde los módulos habilitados.', module: 'members' },
    }
  }

  if (role === 'trainer' && userId) {
    const [sessions, classes] = await Promise.all([
      supabase.from('training_sessions').select('id,starts_at,status,member:members(full_name)').eq('trainer_user_id', userId).gte('starts_at', asDate(today())).order('starts_at'),
      supabase.from('gym_classes').select('id,name,starts_at,capacity').eq('trainer_user_id', userId).gte('starts_at', asDate(today())).order('starts_at'),
    ])
    if (sessions.error) throw sessions.error
    if (classes.error) throw classes.error
    const items = [
      ...(sessions.data ?? []).map((row) => {
        const relatedMember = Array.isArray(row.member) ? row.member[0] : row.member
        return { title: (relatedMember as { full_name: string } | null)?.full_name ?? 'Entrenamiento personal', detail: new Date(row.starts_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }), status: row.status, tone: 'success' as const, module: 'trainers' }
      }),
      ...(classes.data ?? []).map((row) => ({ title: row.name, detail: new Date(row.starts_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }), status: `${row.capacity} cupos`, tone: 'info' as const, module: 'classes' })),
    ]
    return {
      description: 'Tu agenda y sesiones asignadas para hoy.',
      metrics: [
        { label: 'SESIONES HOY', value: String(sessions.data?.length ?? 0), detail: 'Entrenamientos personales', icon: 'trainer', tone: 'info', module: 'trainers' },
        { label: 'CLASES HOY', value: String(classes.data?.length ?? 0), detail: 'Clases a tu cargo', icon: 'calendar', tone: 'success', module: 'classes' },
        { label: 'COMPLETADAS', value: String(sessions.data?.filter((row) => row.status === 'Completada').length ?? 0), detail: 'Sesiones registradas hoy', icon: 'check', tone: 'success', module: 'trainers' },
        { label: 'PRÓXIMAS', value: String(items.length), detail: 'Actividades en agenda', icon: 'clock', tone: 'warning', module: 'classes' },
      ], items, focus: { title: items[0]?.title ?? 'Sin actividades hoy', detail: items[0]?.detail ?? 'Tu agenda aparecerá aquí cuando te asignen sesiones o clases.', module: items[0]?.module ?? 'classes' },
    }
  }

  if (role === 'member' && memberId) {
    const [membership, visits, bookings] = await Promise.all([
      supabase.from('members').select('membership_status,expires_at,plan_name').eq('id', memberId).single(),
      supabase.from('attendance').select('id', { count: 'exact' }).eq('member_id', memberId).gte('checked_in_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      supabase.from('class_bookings').select('id,booking_status,gym_class:gym_classes(name,starts_at,trainer_name)').eq('member_id', memberId).eq('booking_status', 'Reservada').order('created_at', { ascending: false }),
    ])
    const failure = [membership.error, visits.error, bookings.error].find(Boolean)
    if (failure) throw failure
    const currentMembership = membership.data
    if (!currentMembership) throw new Error('No encontramos tu membresía.')
    const expires = currentMembership.expires_at
    return {
      description: 'Consulta tu membresía y organiza tus próximas actividades.',
      metrics: [
        { label: 'MEMBRESÍA', value: currentMembership.membership_status, detail: `${currentMembership.plan_name} · vence ${expires}`, icon: 'card', tone: currentMembership.membership_status === 'Vigente' ? 'success' : 'warning', module: 'memberships' },
        { label: 'VISITAS ESTE MES', value: String(visits.count ?? 0), detail: 'Ingresos registrados', icon: 'check', tone: 'success', module: 'memberships' },
        { label: 'MIS RESERVAS', value: String(bookings.data?.length ?? 0), detail: 'Clases reservadas', icon: 'calendar', tone: 'info', module: 'classes' },
        { label: 'PLAN', value: currentMembership.plan_name, detail: 'Membresía actual', icon: 'users', tone: 'neutral', module: 'memberships' },
      ],
      items: (bookings.data ?? []).map((row) => {
        const relatedClass = Array.isArray(row.gym_class) ? row.gym_class[0] : row.gym_class
        return { title: (relatedClass as { name: string } | null)?.name ?? 'Clase', detail: row.booking_status, status: row.booking_status, tone: 'success' as const, module: 'classes' }
      }),
      focus: { title: 'Reserva tu próxima clase', detail: 'Elige una actividad disponible desde el módulo Clases.', module: 'classes' },
    }
  }

  const [equipment, tickets] = await Promise.all([
    supabase.from('equipment').select('id,status', { count: 'exact' }),
    supabase.from('maintenance_tickets').select('id,title,priority,status,due_at').neq('status', 'Resuelta').order('created_at', { ascending: false }),
  ])
  if (equipment.error) throw equipment.error
  if (tickets.error) throw tickets.error
  return {
    description: 'Prioridades y tareas de mantenimiento del gimnasio.',
    metrics: [
      { label: 'EQUIPOS', value: String(equipment.count ?? 0), detail: 'Inventario registrado', icon: 'tool', tone: 'info', module: 'maintenance' },
      { label: 'OPERATIVOS', value: String(equipment.data?.filter((item) => item.status === 'Operativa').length ?? 0), detail: 'Equipos en servicio', icon: 'check', tone: 'success', module: 'maintenance' },
      { label: 'INCIDENCIAS ABIERTAS', value: String(tickets.data?.length ?? 0), detail: 'Pendientes de resolver', icon: 'warning', tone: 'danger', module: 'maintenance' },
      { label: 'URGENTES', value: String(tickets.data?.filter((item) => item.priority === 'Urgente' || item.priority === 'Alta').length ?? 0), detail: 'Prioridad alta o urgente', icon: 'clock', tone: 'warning', module: 'maintenance' },
    ],
    items: (tickets.data ?? []).map((row) => ({ title: row.title, detail: row.due_at ? `Fecha límite ${row.due_at}` : 'Sin fecha límite', status: row.status, tone: row.priority === 'Alta' || row.priority === 'Urgente' ? 'danger' : 'warning', module: 'maintenance' })),
    focus: { title: tickets.data?.[0]?.title ?? 'Sin incidencias abiertas', detail: 'Registra equipos y actualiza las órdenes de mantenimiento.', module: 'maintenance' },
  }
}

function demoDashboard(role: UserRole): DashboardSnapshot {
  if (role === 'member') return {
    description: 'Tu cuenta está en modo demostración. Conecta Supabase para ver datos personales.',
    metrics: [{ label: 'SOCIOS DE PRUEBA', value: String(members.length), detail: 'Datos de demostración', icon: 'users', tone: 'info', module: 'memberships' }],
    items: [], focus: { title: 'Datos de ejemplo', detail: 'Las reservas personales requieren una cuenta vinculada a una membresía.', module: 'classes' },
  }
  if (role === 'maintenance') return {
    description: 'Revisa equipos e incidencias de mantenimiento.',
    metrics: [{ label: 'EQUIPOS DE EJEMPLO', value: '4', detail: 'Datos de demostración', icon: 'tool', tone: 'info', module: 'maintenance' }],
    items: [], focus: { title: 'Incidencias', detail: 'Registra y actualiza órdenes desde Mantenimiento.', module: 'maintenance' },
  }
  return {
    description: 'Resumen de demostración del sistema de gimnasio.',
    metrics: [
      { label: 'SOCIOS DE PRUEBA', value: String(members.length), detail: 'Datos del prototipo', icon: 'users', tone: 'success', module: 'members' },
      { label: 'ASISTENCIA SEMANAL', value: String(attendance.reduce((sum, item) => sum + item.value, 0)), detail: 'Visitas de ejemplo', icon: 'check', tone: 'info', module: 'reports' },
      { label: 'CLASES PRÓXIMAS', value: String(upcomingClasses.length), detail: 'Agenda de muestra', icon: 'calendar', tone: 'warning', module: 'classes' },
    ],
    items: upcomingClasses.map((item) => ({ title: item.name, detail: `${item.time} · ${item.trainer}`, status: `${item.booked}/${item.capacity} cupos`, tone: 'info', module: 'classes' })),
    focus: { title: 'Resumen del gimnasio', detail: 'Conecta Supabase para cargar información real.', module: 'members' },
  }
}
