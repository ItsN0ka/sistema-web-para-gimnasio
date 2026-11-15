import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Icon } from '../../components/ui/Icon'
import type { UserRole } from '../../data/roles'
import { isSupabaseConfigured } from '../../lib/supabase'
import { loadOperations, saveOperation, setClassBooking, type FormField, type OperationRow, type OperationsData } from './operationsService'

type Props = { moduleId: string; role: UserRole; userId: string | null; memberId: string | null }

export function OperationsPage({ moduleId, role, userId, memberId }: Props) {
  const [data, setData] = useState<OperationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<OperationRow | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [equipmentForm, setEquipmentForm] = useState(false)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true); setError('')
    try { setData(await loadOperations(moduleId, role, userId, memberId)) }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'No pudimos cargar los registros.') }
    finally { setLoading(false) }
  }, [moduleId, role, userId, memberId])
  useEffect(() => { void refresh() }, [refresh])

  const filteredRows = (data?.rows ?? []).filter((row) => row.cells.join(' ').toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')))
  const rowCanEdit = (row: OperationRow) => Boolean(data?.canEdit && row.editable !== false)
  const openCreate = () => { setEditing(null); setEquipmentForm(false); setShowForm(true); setNotice('') }
  const openEdit = (row: OperationRow) => { setEditing(row); setEquipmentForm(false); setShowForm(true); setNotice('') }
  const openNewEquipment = () => { setEditing(null); setEquipmentForm(true); setShowForm(true); setNotice('') }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!data) return
    setBusy(true); setError(''); setNotice('')
    try {
      const form = Object.fromEntries(new FormData(event.currentTarget).entries())
      const rowKind = editing?.values.row_kind
      const targetModule = equipmentForm || rowKind === 'equipment' ? 'equipment' : moduleId
      await saveOperation(targetModule, form, editing?.id ?? (equipmentForm ? 'equipment:new' : null), role, userId)
      setShowForm(false); setNotice('Cambios guardados.'); await refresh()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo guardar.') }
    finally { setBusy(false) }
  }

  async function handleRowAction(row: OperationRow) {
    if (row.action && moduleId === 'classes' && memberId) {
      setBusy(true); setError('')
      try { await setClassBooking(row.id, memberId, row.action === 'Cancelar'); setNotice(row.action === 'Cancelar' ? 'Reserva cancelada.' : 'Cupo reservado.'); await refresh() }
      catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo actualizar la reserva.') }
      finally { setBusy(false) }
      return
    }
    if (rowCanEdit(row)) openEdit(row)
  }

  function exportCsv() {
    if (!data) return
    const escape = (cell: string) => `"${cell.replace(/"/g, '""')}"`
    const csv = [data.columns, ...filteredRows.map((row) => [...row.cells, row.status])].map((row) => row.map(escape).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${moduleId}-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url)
  }

  if (loading && !data) return <section className="panel loading-panel">Cargando información…</section>
  if (!data) return <section className="panel profile-panel"><p role="alert">{error || 'No hay información disponible.'}</p><button className="secondary-button" onClick={() => void refresh()}>Reintentar</button></section>

  const isReport = moduleId === 'reports'
  return <div className="page">
    <section className="page-heading"><div><p className="eyebrow">{data.eyebrow}</p><h1>{data.title}</h1><p>{data.description}</p></div>
      {isReport ? <button className="primary-button" onClick={exportCsv}><Icon name="report" size={18}/> {data.primaryAction}</button> : data.canCreate && <button className="primary-button" onClick={openCreate}><Icon name="plus" size={18}/> {data.primaryAction}</button>}
    </section>
    {data.summary && <section className="operation-stats">{data.summary.map((item) => <article key={item.label}><span className={`operation-icon tone-${item.tone}`}><Icon name="chart"/></span><div><small>{item.label}</small><strong>{item.value}</strong><p>{item.detail}</p></div></article>)}</section>}
    {notice && <p className="form-message success-message" role="status">{notice}</p>}{error && <p className="form-message error-message" role="alert">{error}</p>}
    {!isSupabaseConfigured && <p className="form-message">Vista de demostración: configura las variables de Supabase para guardar cambios.</p>}
    <section className="panel operation-panel"><div className="panel-header"><div><h2>Registros</h2><p>{filteredRows.length} resultado(s)</p></div><div className="table-actions"><label className="local-search"><Icon name="search" size={17}/><input aria-label="Buscar registros" placeholder="Buscar…" value={search} onChange={(event) => setSearch(event.target.value)}/></label><button className="secondary-button" onClick={() => void refresh()} disabled={loading}>Actualizar</button></div></div>
      {loading ? <p className="empty-state">Actualizando…</p> : filteredRows.length === 0 ? <div className="empty-state"><strong>No hay registros</strong><p>Cuando haya información, aparecerá aquí.</p></div> : <div className="table-wrap"><table><thead><tr>{data.columns.map((column) => <th key={column}>{column}</th>)}{!isReport && <th>Estado</th>}{(data.canEdit || filteredRows.some((row) => row.action)) && <th>Acción</th>}</tr></thead>
      <tbody>{filteredRows.map((row) => <tr key={row.id}>{row.cells.map((cell, index) => <td key={`${row.id}-${index}`}>{cell}</td>)}{!isReport && <td><Badge tone={row.tone}>{row.status}</Badge></td>}{(rowCanEdit(row) || row.action) && <td><button className="row-action" aria-label={row.action ?? 'Editar registro'} title={row.action ?? 'Editar registro'} disabled={busy} onClick={() => void handleRowAction(row)}>{row.action ? row.action : <Icon name="chevron" size={17}/>}</button></td>}</tr>)}</tbody></table></div>}
    </section>
    {data.secondaryAction && data.canCreate && <button className="secondary-button" onClick={openNewEquipment}>{data.secondaryAction}</button>}
    {showForm && <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false) }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="operation-form-title"><header className="modal-header"><div><p className="eyebrow">{editing ? 'EDICIÓN' : 'NUEVO REGISTRO'}</p><h2 id="operation-form-title">{editing ? 'Editar registro' : data.primaryAction}</h2></div><button className="row-action" aria-label="Cerrar" onClick={() => setShowForm(false)}><Icon name="close"/></button></header>
      <form onSubmit={submit}>{formFields(equipmentForm || editing?.values.row_kind === 'equipment' ? equipmentFields : data.fields, editing)}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancelar</button><button type="submit" className="primary-button" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button></div></form></section></div>}
  </div>
}

function formFields(fields: FormField[], row: OperationRow | null) {
  const normalizedKind = row?.values.row_kind
  return fields.filter((field) => !(normalizedKind === 'equipment' && ['equipment_id', 'title', 'description', 'priority', 'due_at'].includes(field.name))).map((field) => {
    let defaultValue = row?.values[field.name]
    if (field.type === 'datetime-local' && defaultValue) defaultValue = new Date(String(defaultValue)).toISOString().slice(0, 16)
    if (field.type === 'date' && defaultValue) defaultValue = String(defaultValue).slice(0, 10)
    const common = { name: field.name, required: field.required, defaultValue: String(defaultValue ?? ''), id: `field-${field.name}` }
    return <label key={field.name} htmlFor={common.id}>{field.label}{field.type === 'select' ? <select {...common}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === 'textarea' ? <textarea {...common} rows={3}/> : <input {...common} type={field.type ?? 'text'} min={field.type === 'number' ? '0' : undefined} step={field.type === 'number' ? 'any' : undefined}/>}</label>
  })
}

const equipmentFields: FormField[] = [
  { name: 'equipment_code', label: 'Código', required: true }, { name: 'name', label: 'Nombre del equipo', required: true },
  { name: 'zone', label: 'Zona', required: true },
  { name: 'status', label: 'Estado', type: 'select', required: true, options: ['Operativa', 'Revisión', 'En reparación', 'Fuera de servicio'].map((item) => ({ label: item, value: item })) },
  { name: 'notes', label: 'Notas', type: 'textarea' }, { name: 'next_maintenance_at', label: 'Próximo mantenimiento', type: 'date' },
]
