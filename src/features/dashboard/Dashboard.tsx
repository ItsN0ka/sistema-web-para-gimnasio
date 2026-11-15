import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Icon } from '../../components/ui/Icon'
import { attendance, members, recentActivity, upcomingClasses } from '../../data/mockData'
import { MetricCard } from './MetricCard'

export function Dashboard({ onNavigate }: { onNavigate: (module: string) => void }) {
  return (
    <div className="page">
      <section className="page-heading">
        <div><p className="eyebrow">LUNES, 09 DE JUNIO</p><h1>Buenos días, Carolina</h1><p>Aquí tienes el pulso de tu gimnasio para comenzar el día.</p></div>
        <button className="primary-button" onClick={() => onNavigate('members')}><Icon name="plus" size={18} /> Nuevo socio</button>
      </section>

      <section className="metrics-grid">
        <MetricCard label="SOCIOS ACTIVOS" value="486" detail="+18 este mes" icon="users" tone="success" action={() => onNavigate('members')} />
        <MetricCard label="POR VENCER" value="12" detail="Próximos 7 días" icon="clock" tone="warning" action={() => onNavigate('memberships')} />
        <MetricCard label="PAGOS PENDIENTES" value="5" detail="$184.950 por cobrar" icon="warning" tone="danger" action={() => onNavigate('payments')} />
        <MetricCard label="INGRESOS DEL MES" value="$18,4M" detail="+8,4% vs. mayo" icon="chart" tone="info" action={() => onNavigate('finances')} />
      </section>

      <section className="dashboard-grid">
        <article className="panel attendance-panel">
          <div className="panel-header">
            <div><h2>Asistencia semanal</h2><p>Visitas registradas por día</p></div>
            <select aria-label="Periodo"><option>Esta semana</option><option>Semana anterior</option></select>
          </div>
          <div className="chart-summary"><strong>1.284</strong><span><Icon name="chart" size={15} /> 12,5%</span><small>visitas totales</small></div>
          <div className="bar-chart">
            {attendance.map((item) => <div className="bar-column" key={item.day}><div className="bar-track"><span style={{ height: `${item.value}%` }} /></div><small>{item.day}</small></div>)}
          </div>
        </article>

        <article className="panel classes-panel">
          <div className="panel-header"><div><h2>Próximas clases</h2><p>Agenda de esta tarde</p></div><button className="text-button" onClick={() => onNavigate('classes')}>Ver agenda <Icon name="arrow" size={15} /></button></div>
          <div className="class-list">
            {upcomingClasses.map((item) => (
              <button className="class-row" key={item.time} onClick={() => onNavigate('classes')}>
                <span className={`time-block time-${item.tone}`}><strong>{item.time}</strong><small>HOY</small></span>
                <span className="class-info"><strong>{item.name}</strong><small>{item.trainer}</small></span>
                <span className="occupancy"><span><i style={{ width: `${item.booked / item.capacity * 100}%` }} /></span><small>{item.booked}/{item.capacity} cupos</small></span>
                <Icon name="chevron" size={17} />
              </button>
            ))}
          </div>
        </article>

        <article className="panel expiring-panel">
          <div className="panel-header"><div><h2>Membresías por vencer</h2><p>Requieren seguimiento esta semana</p></div><button className="text-button" onClick={() => onNavigate('members')}>Ver todos <Icon name="arrow" size={15} /></button></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Socio</th><th>Plan</th><th>Vencimiento</th><th>Estado</th></tr></thead>
              <tbody>
                {members.filter((member) => member.status !== 'Vigente').slice(0, 3).map((member) => (
                  <tr key={member.id}><td><span className="member-cell"><Avatar initials={member.initials} color={member.color} /><span><strong>{member.name}</strong><small>{member.id}</small></span></span></td><td>{member.plan}</td><td>{member.expires}</td><td><Badge tone={member.status === 'Vencida' ? 'danger' : 'warning'}>{member.status}</Badge></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel activity-panel">
          <div className="panel-header"><div><h2>Actividad reciente</h2><p>Últimos movimientos</p></div></div>
          <div className="activity-list">
            {recentActivity.map((activity) => <div className="activity-row" key={activity.name}><Avatar initials={activity.initials} color={activity.color} size="sm" /><span><strong>{activity.name}</strong> {activity.action}<small>{activity.time}</small></span></div>)}
          </div>
        </article>
      </section>
    </div>
  )
}
