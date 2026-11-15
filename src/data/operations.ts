import type { OperationModule } from '../types/gym'

export const operationalModules: Record<string, OperationModule> = {
  memberships: {
    title: 'Membresías', eyebrow: 'Control comercial', description: 'Administra planes, renovaciones y vencimientos en un solo lugar.', icon: 'card', primaryAction: 'Crear plan',
    stats: [
      { label: 'Membresías vigentes', value: '486', detail: '+18 este mes', tone: 'success' },
      { label: 'Próximas a vencer', value: '12', detail: 'En los próximos 7 días', tone: 'warning' },
      { label: 'Planes disponibles', value: '6', detail: '2 con promoción activa' },
    ],
    columns: ['Plan', 'Socios activos', 'Valor mensual', 'Renovación'],
    rows: [
      { cells: ['Full Access', '184', '$42.990', '78%'], status: 'Activo', tone: 'success' },
      { cells: ['Plan Anual', '126', '$31.990', '86%'], status: 'Activo', tone: 'success' },
      { cells: ['Clases Plus', '98', '$37.990', '71%'], status: 'Activo', tone: 'success' },
      { cells: ['Plan Mensual', '78', '$28.990', '64%'], status: 'Revisar', tone: 'warning' },
    ],
  },
  payments: {
    title: 'Pagos', eyebrow: 'Caja y renovaciones', description: 'Registra cobros y consulta movimientos e historial de cada socio.', icon: 'wallet', primaryAction: 'Registrar pago',
    stats: [
      { label: 'Recaudado hoy', value: '$842.500', detail: '23 transacciones', tone: 'success' },
      { label: 'Pagos pendientes', value: '5', detail: '$184.950 por cobrar', tone: 'danger' },
      { label: 'Renovaciones', value: '18', detail: 'Durante esta semana' },
    ],
    columns: ['Socio', 'Concepto', 'Monto', 'Fecha'],
    rows: [
      { cells: ['Joaquín Castro', 'Full Access', '$42.990', 'Hoy, 09:24'], status: 'Pagado', tone: 'success' },
      { cells: ['Daniela Silva', 'Plan Anual', '$31.990', 'Hoy, 08:51'], status: 'Pagado', tone: 'success' },
      { cells: ['Ignacio León', 'Personal trainer', '$85.000', 'Ayer, 18:10'], status: 'Pendiente', tone: 'warning' },
      { cells: ['Camila Fuentes', 'Clases Plus', '$37.990', '03 Jun'], status: 'Atrasado', tone: 'danger' },
    ],
  },
  classes: {
    title: 'Clases y reservas', eyebrow: 'Agenda de hoy', description: 'Controla horarios, instructores, cupos y asistencia de cada clase.', icon: 'calendar', primaryAction: 'Nueva clase',
    stats: [
      { label: 'Clases hoy', value: '14', detail: '5 ya realizadas' },
      { label: 'Reservas activas', value: '126', detail: '82% de ocupación', tone: 'success' },
      { label: 'Lista de espera', value: '8', detail: 'En 2 clases', tone: 'warning' },
    ],
    columns: ['Clase', 'Horario', 'Instructor', 'Ocupación'],
    rows: [
      { cells: ['Funcional', '17:30', 'Nicolás P.', '14 / 20'], status: 'Disponible', tone: 'success' },
      { cells: ['Spinning', '19:00', 'Fernanda L.', '18 / 20'], status: 'Casi llena', tone: 'warning' },
      { cells: ['Yoga flow', '20:15', 'Camila R.', '9 / 16'], status: 'Disponible', tone: 'success' },
      { cells: ['Cross training', '21:00', 'Nicolás P.', '16 / 16'], status: 'Completa', tone: 'danger' },
    ],
  },
  trainers: {
    title: 'Entrenadores', eyebrow: 'Equipo profesional', description: 'Gestiona horarios, clientes asignados, servicios y pagos.', icon: 'trainer', primaryAction: 'Añadir entrenador',
    stats: [
      { label: 'Entrenadores activos', value: '18', detail: '12 planta · 6 externos' },
      { label: 'Clientes asignados', value: '74', detail: '+9 este mes', tone: 'success' },
      { label: 'Sesiones esta semana', value: '146', detail: '89% completadas' },
    ],
    columns: ['Entrenador', 'Especialidad', 'Clientes', 'Sesiones hoy'],
    rows: [
      { cells: ['Nicolás Paredes', 'Funcional', '12', '6'], status: 'Disponible', tone: 'success' },
      { cells: ['Fernanda Lagos', 'Spinning', '8', '4'], status: 'En clase', tone: 'info' },
      { cells: ['Camila Ríos', 'Yoga', '14', '5'], status: 'Disponible', tone: 'success' },
      { cells: ['Matías Vidal', 'Fuerza', '11', '7'], status: 'Agenda llena', tone: 'warning' },
    ],
  },
  maintenance: {
    title: 'Mantenimiento', eyebrow: 'Equipamiento', description: 'Supervisa máquinas, reparaciones, repuestos y próximas mantenciones.', icon: 'tool', primaryAction: 'Registrar máquina',
    stats: [
      { label: 'Máquinas operativas', value: '86', detail: '95% del equipamiento', tone: 'success' },
      { label: 'En reparación', value: '3', detail: '1 de alta prioridad', tone: 'danger' },
      { label: 'Mantenciones próximas', value: '7', detail: 'Durante este mes', tone: 'warning' },
    ],
    columns: ['Equipo', 'Zona', 'Última mantención', 'Próxima revisión'],
    rows: [
      { cells: ['Cinta T-08', 'Cardio', '18 May 2025', '18 Ago 2025'], status: 'Operativa', tone: 'success' },
      { cells: ['Elíptica E-03', 'Cardio', '04 Mar 2025', '12 Jun 2025'], status: 'Revisión', tone: 'warning' },
      { cells: ['Prensa P-02', 'Musculación', '22 Abr 2025', '22 Jul 2025'], status: 'Operativa', tone: 'success' },
      { cells: ['Bicicleta B-11', 'Spinning', '14 Ene 2025', 'Vencida'], status: 'En reparación', tone: 'danger' },
    ],
  },
  finances: {
    title: 'Finanzas', eyebrow: 'Salud financiera', description: 'Revisa ingresos, gastos, pagos al equipo y flujo mensual.', icon: 'chart', primaryAction: 'Registrar movimiento',
    stats: [
      { label: 'Ingresos del mes', value: '$18,4M', detail: '+8,4% vs. mayo', tone: 'success' },
      { label: 'Gastos del mes', value: '$7,2M', detail: '39% de los ingresos' },
      { label: 'Balance proyectado', value: '$11,2M', detail: 'Meta mensual: $10M', tone: 'success' },
    ],
    columns: ['Movimiento', 'Categoría', 'Monto', 'Fecha'],
    rows: [
      { cells: ['Renovaciones junio', 'Membresías', '+$842.500', 'Hoy'], status: 'Ingreso', tone: 'success' },
      { cells: ['Pago instructores', 'Personal', '-$1.240.000', '05 Jun'], status: 'Gasto', tone: 'neutral' },
      { cells: ['Repuestos cardio', 'Mantenimiento', '-$184.900', '04 Jun'], status: 'Gasto', tone: 'neutral' },
      { cells: ['Servicios PT', 'Entrenamiento', '+$435.000', '03 Jun'], status: 'Ingreso', tone: 'success' },
    ],
  },
  reports: {
    title: 'Reportes', eyebrow: 'Inteligencia del negocio', description: 'Analiza retención, asistencia, ventas y rendimiento del gimnasio.', icon: 'report', primaryAction: 'Crear reporte',
    stats: [
      { label: 'Retención mensual', value: '91,4%', detail: '+2,1% vs. mayo', tone: 'success' },
      { label: 'Asistencia promedio', value: '214', detail: 'Visitas por día' },
      { label: 'Ticket promedio', value: '$38.420', detail: '+4,8% este trimestre' },
    ],
    columns: ['Reporte', 'Periodo', 'Actualización', 'Responsable'],
    rows: [
      { cells: ['Ingresos y gastos', 'Junio 2025', 'Hoy, 09:30', 'Automático'], status: 'Listo', tone: 'success' },
      { cells: ['Retención de socios', 'Q2 2025', 'Ayer, 18:00', 'Automático'], status: 'Listo', tone: 'success' },
      { cells: ['Uso de clases', 'Últimos 30 días', '06 Jun', 'Carolina A.'], status: 'Listo', tone: 'success' },
      { cells: ['Rendimiento PT', 'Junio 2025', 'Pendiente', 'Carolina A.'], status: 'Borrador', tone: 'warning' },
    ],
  },
}
