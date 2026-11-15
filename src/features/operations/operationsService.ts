import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import type { UserRole } from '../../data/roles'
import type { StatusTone } from '../../types/gym'

export interface FormField {
  name: string
  label: string
  type?: 'text' | 'email' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea'
  required?: boolean
  options?: Array<{ label: string; value: string }>
}

export interface OperationRow {
  id: string
  values: Record<string, string | number | null>
  cells: string[]
  status: string
  tone: StatusTone
  action?: string
  editable?: boolean
}

export interface OperationsData {
  title: string
  eyebrow: string
  description: string
  primaryAction: string
  columns: string[]
  fields: FormField[]
  rows: OperationRow[]
  canCreate: boolean
  canEdit: boolean
  secondaryAction?: string
  summary?: Array<{ label: string; value: string; detail: string; tone: StatusTone }>
}

const value = (form: Record<string, FormDataEntryValue>, key: string) => String(form[key] ?? '').trim()
const money = (amount: unknown) => `$${Number(amount ?? 0).toLocaleString('es-CL')}`
const dateTime = (input: string) => input ? new Date(input).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '—'
const statusTone = (status: string): StatusTone => {
  if (['Pagado', 'Operativa', 'Completada', 'Reservada', 'Resuelta', 'Activo'].includes(status)) return 'success'
  if (['Pendiente', 'Por vencer', 'Revisión', 'En curso', 'En reparación'].includes(status)) return 'warning'
  if (['Anulado', 'Vencida', 'Fuera de servicio', 'Urgente', 'Alta'].includes(status)) return 'danger'
  return 'info'
}

function demoData(moduleId: string, role: UserRole): OperationsData {
  const definitions: Record<string, OperationsData> = {
    memberships: { title: 'Membresías', eyebrow: 'Planes y renovaciones', description: 'Consulta los planes vigentes del gimnasio.', primaryAction: 'Crear plan', columns: ['Plan', 'Precio', 'Duración', 'Estado'], fields: [], rows: [], canCreate: false, canEdit: false },
    payments: { title: 'Pagos', eyebrow: 'Caja y renovaciones', description: 'Consulta los pagos registrados.', primaryAction: 'Registrar pago', columns: ['Socio', 'Concepto', 'Monto', 'Método'], fields: [], rows: [], canCreate: false, canEdit: false },
    classes: { title: 'Clases y reservas', eyebrow: 'Agenda', description: 'Consulta horarios y reserva tus clases.', primaryAction: 'Reservar clase', columns: ['Clase', 'Instructor', 'Horario', 'Cupos'], fields: [], rows: [], canCreate: false, canEdit: false },
    trainers: { title: 'Entrenadores', eyebrow: 'Equipo profesional', description: 'Consulta especialidades y sesiones.', primaryAction: 'Registrar sesión', columns: ['Entrenador', 'Especialidad', 'Sesiones'], fields: [], rows: [], canCreate: false, canEdit: false },
    maintenance: { title: 'Mantenimiento', eyebrow: 'Equipamiento', description: 'Revisa equipos e incidencias.', primaryAction: 'Nueva incidencia', columns: ['Equipo / incidencia', 'Zona', 'Prioridad', 'Estado'], fields: [], rows: [], canCreate: false, canEdit: false },
    finances: { title: 'Finanzas', eyebrow: 'Salud financiera', description: 'Control de gastos y pagos del gimnasio.', primaryAction: 'Registrar gasto', columns: ['Descripción', 'Categoría', 'Monto', 'Fecha'], fields: [], rows: [], canCreate: false, canEdit: false },
    reports: { title: 'Reportes', eyebrow: 'Inteligencia del negocio', description: 'Resumen de actividad del gimnasio.', primaryAction: 'Exportar CSV', columns: ['Indicador', 'Valor', 'Detalle'], fields: [], rows: [], canCreate: false, canEdit: false },
  }
  const result = definitions[moduleId] ?? definitions.memberships
  if (moduleId === 'classes' && role === 'member') result.primaryAction = 'Elige una clase para reservar'
  return result
}

export async function loadOperations(moduleId: string, role: UserRole, userId: string | null, memberId: string | null): Promise<OperationsData> {
  if (!isSupabaseConfigured || !supabase) return demoData(moduleId, role)

  if (moduleId === 'memberships') {
    const canEdit = role === 'owner'
    const { data, error } = await supabase.from('membership_plans').select('*').order('name')
    if (error) throw error
    let ownMembership: Array<Record<string, unknown>> = []
    if (role === 'member' && memberId) {
      const result = await supabase.from('members').select('plan_name,membership_status,expires_at').eq('id', memberId).limit(1)
      if (result.error) throw result.error
      ownMembership = (result.data ?? []) as Array<Record<string, unknown>>
    }
    return {
      title: 'Membresías', eyebrow: role === 'member' ? 'Mi plan' : 'Planes y renovaciones', description: role === 'member' ? 'Consulta las condiciones de tu membresía.' : 'Administra planes, precios y vigencia.', primaryAction: 'Crear plan',
      columns: ['Plan', 'Precio', 'Duración', 'Estado'], canCreate: canEdit, canEdit,
      fields: [{ name: 'name', label: 'Nombre del plan', required: true }, { name: 'description', label: 'Descripción', type: 'textarea' }, { name: 'price', label: 'Precio (CLP)', type: 'number', required: true }, { name: 'duration_days', label: 'Duración (días)', type: 'number', required: true }, { name: 'is_active', label: 'Estado', type: 'select', options: [{ label: 'Activo', value: 'true' }, { label: 'Inactivo', value: 'false' }] }],
      rows: (role === 'member' ? ownMembership : data ?? []).map((row: any) => {
        const plan = role === 'member' ? row.plan_name : row.name
        const active = role === 'member' ? row.membership_status === 'Vigente' : row.is_active
        return { id: String(row.id ?? plan), values: row, cells: [String(plan), role === 'member' ? row.membership_status : money(row.price), role === 'member' ? String(row.expires_at) : `${row.duration_days} días`, active ? 'Activo' : 'Inactivo'], status: active ? 'Activo' : 'Inactivo', tone: active ? 'success' : 'neutral' }
      }),
    }
  }

  if (moduleId === 'payments') {
    let paymentsQuery = supabase.from('payments').select('id,member_id,amount,payment_method,payment_status,paid_at,notes').order('paid_at', { ascending: false })
    let membersQuery = supabase.from('members').select('id,full_name,member_number,plan_name').order('full_name')
    if (role === 'member' && memberId) {
      paymentsQuery = paymentsQuery.eq('member_id', memberId)
      membersQuery = membersQuery.eq('id', memberId)
    }
    const [paymentsResult, membersResult] = await Promise.all([
      paymentsQuery,
      membersQuery,
    ])
    if (paymentsResult.error) throw paymentsResult.error
    if (membersResult.error) throw membersResult.error
    const memberMap = new Map((membersResult.data ?? []).map((item: any) => [item.id, item]))
    const memberOptions = (membersResult.data ?? []).map((item: any) => ({ label: `${item.full_name} · ${item.member_number}`, value: item.id }))
    return {
      title: 'Pagos', eyebrow: 'Caja y renovaciones', description: role === 'member' ? 'Historial de pagos de tu membresía.' : 'Registra cobros y revisa el historial de pagos.', primaryAction: 'Registrar pago', columns: ['Socio', 'Concepto', 'Monto', 'Método', 'Fecha'],
      canCreate: role === 'owner' || role === 'reception', canEdit: role === 'owner',
      fields: [{ name: 'member_id', label: 'Socio', type: 'select', required: true, options: memberOptions }, { name: 'amount', label: 'Monto (CLP)', type: 'number', required: true }, { name: 'payment_method', label: 'Método de pago', type: 'select', required: true, options: ['Efectivo', 'Tarjeta', 'Transferencia'].map((item) => ({ label: item, value: item })) }, { name: 'payment_status', label: 'Estado', type: 'select', required: true, options: ['Pagado', 'Pendiente', 'Anulado'].map((item) => ({ label: item, value: item })) }, { name: 'notes', label: 'Notas', type: 'textarea' }],
      rows: (paymentsResult.data ?? []).map((row: any) => {
        const member = memberMap.get(row.member_id) as any
        return { id: row.id, values: row, cells: [member?.full_name ?? 'Socio', member?.plan_name ?? 'Membresía', money(row.amount), row.payment_method, dateTime(row.paid_at)], status: row.payment_status, tone: statusTone(row.payment_status) }
      }),
    }
  }

  if (moduleId === 'classes') {
    const classesResult = await supabase.from('gym_classes').select('id,name,trainer_name,trainer_user_id,starts_at,duration_minutes,capacity,is_active').eq('is_active', true).order('starts_at')
    if (classesResult.error) throw classesResult.error
    const visibleClasses = (classesResult.data ?? []).filter((row: any) => role !== 'trainer' || row.trainer_user_id === userId)
    const classIds = visibleClasses.map((row: any) => row.id)
    const [bookingsResult, countsResult] = await Promise.all([
      supabase.from('class_bookings').select('id,class_id,member_id,booking_status').in('class_id', classIds.length ? classIds : ['00000000-0000-0000-0000-000000000000']),
      role === 'member' ? supabase.rpc('class_booking_counts', { class_ids: classIds }) : Promise.resolve({ data: null, error: null }),
    ])
    if (bookingsResult.error) throw bookingsResult.error
    if (countsResult.error) throw countsResult.error
    const trainerDirectory = role === 'owner' ? await supabase.from('trainer_profiles').select('user_id,display_name').order('display_name') : null
    if (trainerDirectory?.error) throw trainerDirectory.error
    const bookings = bookingsResult.data ?? []
    const bookingCounts = new Map(((countsResult.data ?? []) as Array<{ class_id: string; booked: number }>).map((item) => [item.class_id, item.booked]))
    const ownBookings = new Map((bookings as any[]).filter((item) => item.member_id === memberId).map((item) => [item.class_id, item]))
    const fields: FormField[] = [{ name: 'name', label: 'Nombre de la clase', required: true }, { name: 'trainer_name', label: 'Nombre del instructor', required: true }, ...(role === 'owner' ? [{ name: 'trainer_user_id', label: 'Cuenta del entrenador', type: 'select' as const, options: [{ label: 'Sin asignar', value: '' }, ...(trainerDirectory?.data ?? []).map((item: any) => ({ label: item.display_name, value: item.user_id }))] }] : []), { name: 'starts_at', label: 'Fecha y hora', type: 'datetime-local', required: true }, { name: 'duration_minutes', label: 'Duración (minutos)', type: 'number', required: true }, { name: 'capacity', label: 'Cupos', type: 'number', required: true }]
    return {
      title: 'Clases y reservas', eyebrow: 'Agenda', description: role === 'member' ? 'Elige una clase futura para reservar tu cupo.' : 'Administra horarios, cupos y reservas.', primaryAction: role === 'member' ? 'Reserva desde una clase' : 'Nueva clase', columns: ['Clase', 'Instructor', 'Horario', 'Cupos'],
      canCreate: role === 'owner' || role === 'trainer', canEdit: role === 'owner' || role === 'trainer', fields,
      rows: visibleClasses.map((row: any) => {
        const reservation = ownBookings.get(row.id) as any
        const reserved = reservation?.booking_status === 'Reservada'
        const bookedCount = role === 'member' ? (bookingCounts.get(row.id) ?? 0) : (bookings as any[]).filter((item) => item.class_id === row.id && item.booking_status === 'Reservada').length
        return { id: row.id, values: row, cells: [row.name, row.trainer_name, dateTime(row.starts_at), `${bookedCount}/${row.capacity}`], status: reservation?.booking_status ?? `${row.capacity - bookedCount} disponibles`, tone: reservation ? 'success' : bookedCount >= row.capacity ? 'danger' : 'info', action: role === 'member' ? (reserved ? 'Cancelar' : bookedCount < row.capacity ? 'Reservar' : undefined) : undefined }
      }),
    }
  }

  if (moduleId === 'trainers') {
    const [trainersResult, sessionsResult, membersResult] = await Promise.all([
      supabase.from('trainer_profiles').select('user_id,display_name,specialty,bio').order('display_name'),
      supabase.from('training_sessions').select('id,trainer_user_id,member_id,starts_at,duration_minutes,status,notes').order('starts_at', { ascending: false }),
      supabase.from('members').select('id,full_name,member_number').order('full_name'),
    ])
    if (trainersResult.error) throw trainersResult.error
    if (sessionsResult.error) throw sessionsResult.error
    if (membersResult.error) throw membersResult.error
    const trainerOptions = (trainersResult.data ?? []).map((item: any) => ({ label: `${item.display_name} · ${item.specialty}`, value: item.user_id }))
    const memberOptions = (membersResult.data ?? []).map((item: any) => ({ label: `${item.full_name} · ${item.member_number}`, value: item.id }))
    const trainerNames = new Map((trainersResult.data ?? []).map((item: any) => [item.user_id, item.display_name]))
    const memberNames = new Map((membersResult.data ?? []).map((item: any) => [item.id, item.full_name]))
    const trainers = (trainersResult.data ?? []).map((item: any) => ({ id: item.user_id, values: item, cells: [item.display_name, item.specialty, item.bio ?? '—'], status: 'Entrenador', tone: 'info' as const, editable: false }))
    const sessions = (sessionsResult.data ?? []).filter((item: any) => role === 'owner' || role === 'reception' || item.trainer_user_id === userId || (role === 'member' && item.member_id === memberId)).map((item: any) => ({ id: item.id, values: item, cells: [String(memberNames.get(item.member_id) ?? 'Socio'), String(trainerNames.get(item.trainer_user_id) ?? 'Entrenador'), dateTime(item.starts_at), `${item.duration_minutes} min`], status: item.status, tone: statusTone(item.status) }))
    return {
      title: 'Entrenadores', eyebrow: 'Equipo profesional', description: role === 'member' ? 'Conoce al equipo y las sesiones reservadas para ti.' : 'Consulta el equipo y gestiona entrenamientos personales.', primaryAction: 'Registrar sesión', columns: role === 'member' ? ['Entrenamiento', 'Entrenador', 'Horario', 'Duración'] : ['Socio', 'Entrenador', 'Horario', 'Duración'],
      canCreate: ['owner', 'reception', 'trainer'].includes(role), canEdit: role === 'owner' || role === 'trainer', secondaryAction: role === 'owner' ? 'Ver sesiones' : undefined,
      fields: [{ name: 'trainer_user_id', label: 'Entrenador', type: 'select', required: true, options: trainerOptions }, { name: 'member_id', label: 'Socio', type: 'select', required: true, options: memberOptions }, { name: 'starts_at', label: 'Fecha y hora', type: 'datetime-local', required: true }, { name: 'duration_minutes', label: 'Duración (minutos)', type: 'number', required: true }, { name: 'notes', label: 'Notas', type: 'textarea' }],
      rows: role === 'member' ? sessions : [...trainers, ...sessions],
    }
  }

  if (moduleId === 'maintenance') {
    const [equipmentResult, ticketResult] = await Promise.all([
      supabase.from('equipment').select('*').order('equipment_code'),
      supabase.from('maintenance_tickets').select('id,equipment_id,title,description,priority,status,due_at').order('created_at', { ascending: false }),
    ])
    if (equipmentResult.error) throw equipmentResult.error
    if (ticketResult.error) throw ticketResult.error
    const equipmentNames = new Map((equipmentResult.data ?? []).map((item: any) => [item.id, `${item.equipment_code} · ${item.name}`]))
    return {
      title: 'Mantenimiento', eyebrow: 'Equipamiento', description: 'Registra equipos e incidencias, y actualiza su estado.', primaryAction: 'Nueva incidencia', secondaryAction: 'Nuevo equipo', columns: ['Equipo / incidencia', 'Zona', 'Prioridad', 'Estado'],
      canCreate: role === 'owner' || role === 'maintenance', canEdit: role === 'owner' || role === 'maintenance',
      fields: [{ name: 'equipment_id', label: 'Equipo', type: 'select', options: [{ label: 'Sin equipo asociado', value: '' }, ...(equipmentResult.data ?? []).map((item: any) => ({ label: `${item.equipment_code} · ${item.name}`, value: item.id }))] }, { name: 'title', label: 'Incidencia', required: true }, { name: 'description', label: 'Descripción', type: 'textarea' }, { name: 'priority', label: 'Prioridad', type: 'select', required: true, options: ['Baja', 'Media', 'Alta', 'Urgente'].map((item) => ({ label: item, value: item })) }, { name: 'status', label: 'Estado', type: 'select', required: true, options: ['Pendiente', 'En curso', 'Resuelta', 'Cancelada'].map((item) => ({ label: item, value: item })) }, { name: 'due_at', label: 'Fecha límite', type: 'date' }],
      rows: [
        ...(equipmentResult.data ?? []).map((item: any) => ({ id: `equipment:${item.id}`, values: { ...item, row_kind: 'equipment' }, cells: [`${item.equipment_code} · ${item.name}`, item.zone, '—', item.status], status: item.status, tone: statusTone(item.status) })),
        ...(ticketResult.data ?? []).map((item: any) => ({ id: `ticket:${item.id}`, values: { ...item, row_kind: 'ticket' }, cells: [item.title, String(equipmentNames.get(item.equipment_id) ?? 'Sin equipo'), item.priority, item.status], status: item.status, tone: statusTone(item.priority) })),
      ],
    }
  }

  if (moduleId === 'finances') {
    const [expensesResult, paymentsResult] = await Promise.all([
      supabase.from('operating_expenses').select('id,description,category,amount,paid_at').order('paid_at', { ascending: false }),
      supabase.from('payments').select('amount,payment_status').eq('payment_status', 'Pagado'),
    ])
    if (expensesResult.error) throw expensesResult.error
    if (paymentsResult.error) throw paymentsResult.error
    const income = (paymentsResult.data ?? []).reduce((sum, item: any) => sum + Number(item.amount), 0)
    const expenses = (expensesResult.data ?? []).reduce((sum, item: any) => sum + Number(item.amount), 0)
    return {
      title: 'Finanzas', eyebrow: 'Salud financiera', description: 'Registra gastos operativos y revisa el movimiento financiero.', primaryAction: 'Registrar gasto', columns: ['Descripción', 'Categoría', 'Monto', 'Fecha'], canCreate: true, canEdit: true,
      summary: [{ label: 'Ingresos registrados', value: money(income), detail: 'Pagos confirmados', tone: 'success' }, { label: 'Gastos registrados', value: money(expenses), detail: 'Gastos operativos', tone: 'warning' }, { label: 'Balance', value: money(income - expenses), detail: 'Ingresos menos gastos', tone: income >= expenses ? 'success' : 'danger' }],
      fields: [{ name: 'description', label: 'Descripción', required: true }, { name: 'category', label: 'Categoría', required: true }, { name: 'amount', label: 'Monto (CLP)', type: 'number', required: true }, { name: 'paid_at', label: 'Fecha', type: 'date', required: true }],
      rows: (expensesResult.data ?? []).map((item: any) => ({ id: item.id, values: item, cells: [item.description, item.category, money(item.amount), item.paid_at], status: 'Gasto', tone: 'warning' })),
    }
  }

  if (moduleId === 'reports') {
    const [membersResult, paymentsResult, visitsResult, classesResult, expensesResult] = await Promise.all([
      supabase.from('members').select('id,membership_status', { count: 'exact' }),
      supabase.from('payments').select('amount,payment_status'),
      supabase.from('attendance').select('id', { count: 'exact' }),
      supabase.from('gym_classes').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('operating_expenses').select('amount'),
    ])
    const failure = [membersResult.error, paymentsResult.error, visitsResult.error, classesResult.error, expensesResult.error].find(Boolean)
    if (failure) throw failure
    const income = (paymentsResult.data ?? []).filter((item: any) => item.payment_status === 'Pagado').reduce((sum, item: any) => sum + Number(item.amount), 0)
    const pending = (paymentsResult.data ?? []).filter((item: any) => item.payment_status === 'Pendiente').reduce((sum, item: any) => sum + Number(item.amount), 0)
    const expenseTotal = (expensesResult.data ?? []).reduce((sum, item: any) => sum + Number(item.amount), 0)
    const reportRows = [
      ['Socios registrados', String(membersResult.count ?? 0), 'Total de perfiles de socio'],
      ['Membresías vigentes', String(membersResult.data?.filter((item: any) => item.membership_status === 'Vigente').length ?? 0), 'Estado vigente'],
      ['Ingresos confirmados', money(income), 'Pagos con estado Pagado'],
      ['Pagos pendientes', money(pending), 'Saldo pendiente de cobro'],
      ['Asistencias registradas', String(visitsResult.count ?? 0), 'Historial de ingresos'],
      ['Clases activas', String(classesResult.count ?? 0), 'Agenda activa'],
      ['Gastos operativos', money(expenseTotal), 'Total registrado'],
    ]
    return { title: 'Reportes', eyebrow: 'Inteligencia del negocio', description: 'Indicadores calculados desde los registros actuales.', primaryAction: 'Exportar CSV', columns: ['Indicador', 'Valor', 'Detalle'], canCreate: false, canEdit: false, fields: [], rows: reportRows.map(([label, current, detail]) => ({ id: label, values: { label, value: current, detail }, cells: [label, current, detail], status: 'Actualizado', tone: 'info' })) }
  }

  return demoData(moduleId, role)
}

export async function saveOperation(moduleId: string, values: Record<string, FormDataEntryValue>, recordId: string | null, role: UserRole, userId: string | null) {
  if (!supabase) throw new Error('Configura Supabase para guardar cambios.')
  if (moduleId === 'equipment') {
    const input = { equipment_code: value(values, 'equipment_code'), name: value(values, 'name'), zone: value(values, 'zone'), status: value(values, 'status'), notes: value(values, 'notes'), next_maintenance_at: value(values, 'next_maintenance_at') || null }
    const id = recordId?.startsWith('equipment:') && recordId !== 'equipment:new' ? recordId.slice('equipment:'.length) : null
    const result = id ? await supabase.from('equipment').update(input).eq('id', id) : await supabase.from('equipment').insert(input)
    if (result.error) throw result.error
    return
  }
  if (moduleId === 'memberships') {
    const input = { name: value(values, 'name'), description: value(values, 'description'), price: Number(value(values, 'price')), duration_days: Number(value(values, 'duration_days')), is_active: value(values, 'is_active') !== 'false' }
    const result = recordId ? await supabase.from('membership_plans').update(input).eq('id', recordId) : await supabase.from('membership_plans').insert(input)
    if (result.error) throw result.error
    return
  }
  if (moduleId === 'payments') {
    const input = { member_id: value(values, 'member_id'), amount: Number(value(values, 'amount')), payment_method: value(values, 'payment_method'), payment_status: value(values, 'payment_status'), notes: value(values, 'notes') }
    const result = recordId ? await supabase.from('payments').update(input).eq('id', recordId) : await supabase.from('payments').insert(input)
    if (result.error) throw result.error
    return
  }
  if (moduleId === 'classes') {
    const input = { name: value(values, 'name'), trainer_name: value(values, 'trainer_name'), starts_at: new Date(value(values, 'starts_at')).toISOString(), duration_minutes: Number(value(values, 'duration_minutes')), capacity: Number(value(values, 'capacity')), trainer_user_id: role === 'trainer' ? userId : (value(values, 'trainer_user_id') || null) }
    const result = recordId ? await supabase.from('gym_classes').update(input).eq('id', recordId) : await supabase.from('gym_classes').insert(input)
    if (result.error) throw result.error
    return
  }
  if (moduleId === 'trainers') {
    const input = { trainer_user_id: role === 'trainer' ? userId : value(values, 'trainer_user_id'), member_id: value(values, 'member_id'), starts_at: new Date(value(values, 'starts_at')).toISOString(), duration_minutes: Number(value(values, 'duration_minutes')), notes: value(values, 'notes') }
    const result = recordId ? await supabase.from('training_sessions').update(input).eq('id', recordId) : await supabase.from('training_sessions').insert(input)
    if (result.error) throw result.error
    return
  }
  if (moduleId === 'maintenance') {
    if (recordId?.startsWith('equipment:')) {
      const input = { equipment_code: value(values, 'equipment_code'), name: value(values, 'name'), zone: value(values, 'zone'), status: value(values, 'status'), notes: value(values, 'notes'), next_maintenance_at: value(values, 'next_maintenance_at') || null }
      const result = await supabase.from('equipment').update(input).eq('id', recordId.slice('equipment:'.length))
      if (result.error) throw result.error
      return
    }
    const input = { equipment_id: value(values, 'equipment_id') || null, title: value(values, 'title'), description: value(values, 'description'), priority: value(values, 'priority'), status: value(values, 'status'), due_at: value(values, 'due_at') || null, reported_by: userId }
    const id = recordId?.startsWith('ticket:') ? recordId.slice('ticket:'.length) : null
    const result = id ? await supabase.from('maintenance_tickets').update(input).eq('id', id) : await supabase.from('maintenance_tickets').insert(input)
    if (result.error) throw result.error
    return
  }
  if (moduleId === 'finances') {
    const input = { description: value(values, 'description'), category: value(values, 'category'), amount: Number(value(values, 'amount')), paid_at: value(values, 'paid_at'), created_by: userId }
    const result = recordId ? await supabase.from('operating_expenses').update(input).eq('id', recordId) : await supabase.from('operating_expenses').insert(input)
    if (result.error) throw result.error
    return
  }
  throw new Error('Este módulo es de solo lectura.')
}

export async function setClassBooking(classId: string, memberId: string, currentlyReserved: boolean) {
  if (!supabase) throw new Error('Configura Supabase para realizar reservas.')
  if (currentlyReserved) {
    const { error } = await supabase.from('class_bookings').update({ booking_status: 'Cancelada' }).eq('class_id', classId).eq('member_id', memberId)
    if (error) throw error
  } else {
    const existing = await supabase.from('class_bookings').select('id,booking_status').eq('class_id', classId).eq('member_id', memberId).maybeSingle()
    if (existing.error) throw existing.error
    if (existing.data?.booking_status === 'Cancelada') {
      const removed = await supabase.from('class_bookings').delete().eq('id', existing.data.id)
      if (removed.error) throw removed.error
    }
    const { error } = await supabase.from('class_bookings').insert({ class_id: classId, member_id: memberId, booking_status: 'Reservada' })
    if (error) throw error
  }
}
