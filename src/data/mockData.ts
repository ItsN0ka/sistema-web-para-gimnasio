import type { Member } from '../types/gym'

export const members: Member[] = [
  { id: 'S-1048', name: 'Valentina Rojas', initials: 'VR', plan: 'Full Access', expires: '12 Jun 2025', status: 'Por vencer', lastVisit: 'Hoy, 08:42', email: 'valentina@correo.cl', color: 'coral' },
  { id: 'S-1021', name: 'Martín Soto', initials: 'MS', plan: 'Plan Anual', expires: '18 Dic 2025', status: 'Vigente', lastVisit: 'Ayer, 19:10', email: 'martin@correo.cl', color: 'violet' },
  { id: 'S-0998', name: 'Camila Fuentes', initials: 'CF', plan: 'Clases Plus', expires: '08 Jun 2025', status: 'Vencida', lastVisit: '03 Jun, 17:32', email: 'camila@correo.cl', color: 'blue' },
  { id: 'S-0974', name: 'Diego Morales', initials: 'DM', plan: 'Full Access', expires: '28 Jun 2025', status: 'Vigente', lastVisit: 'Hoy, 07:05', email: 'diego@correo.cl', color: 'green' },
  { id: 'S-0942', name: 'Antonia Pérez', initials: 'AP', plan: 'Plan Mensual', expires: '14 Jun 2025', status: 'Por vencer', lastVisit: '05 Jun, 20:15', email: 'antonia@correo.cl', color: 'gold' },
]

export const recentActivity = [
  { initials: 'VR', name: 'Valentina Rojas', action: 'registró su entrada', time: 'Hace 8 min', color: 'coral' },
  { initials: 'JC', name: 'Joaquín Castro', action: 'renovó Plan Full Access', time: 'Hace 24 min', color: 'blue' },
  { initials: 'AM', name: 'Andrea Muñoz', action: 'reservó Spinning 19:00', time: 'Hace 41 min', color: 'green' },
]

export const upcomingClasses = [
  { time: '17:30', name: 'Funcional', trainer: 'Nicolás P.', booked: 14, capacity: 20, tone: 'orange' },
  { time: '19:00', name: 'Spinning', trainer: 'Fernanda L.', booked: 18, capacity: 20, tone: 'violet' },
  { time: '20:15', name: 'Yoga flow', trainer: 'Camila R.', booked: 9, capacity: 16, tone: 'green' },
]

export const attendance = [
  { day: 'Lun', value: 68 },
  { day: 'Mar', value: 82 },
  { day: 'Mié', value: 61 },
  { day: 'Jue', value: 91 },
  { day: 'Vie', value: 76 },
  { day: 'Sáb', value: 48 },
  { day: 'Dom', value: 34 },
]
