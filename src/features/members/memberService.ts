import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { members as demoMembers } from '../../data/mockData'
import type { Member } from '../../types/gym'

type MemberRow = {
  id: string
  member_number: string
  full_name: string
  email: string
  plan_name: string
  membership_status: Member['status']
  expires_at: string
}

const colors = ['coral', 'violet', 'blue', 'green', 'gold']

function toMember(row: MemberRow): Member {
  const initials = row.full_name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return {
    id: row.member_number,
    name: row.full_name,
    initials,
    plan: row.plan_name,
    expires: new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: 'UTC' }).format(
      new Date(`${row.expires_at}T00:00:00Z`),
    ),
    status: row.membership_status,
    lastVisit: 'Sin ingresos',
    email: row.email,
    color: colors[row.full_name.length % colors.length],
  }
}

export async function listMembers(): Promise<Member[]> {
  if (!isSupabaseConfigured || !supabase) return demoMembers

  const { data, error } = await supabase
    .from('members')
    .select('id, member_number, full_name, email, plan_name, membership_status, expires_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as MemberRow[]).map(toMember)
}

export async function createMember(input: { name: string; email: string; plan: string }): Promise<Member> {
  if (!isSupabaseConfigured || !supabase) {
    const initials = input.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()

    return {
      id: `S-${Date.now().toString().slice(-6)}`,
      name: input.name,
      initials,
      plan: input.plan,
      expires: new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ),
      status: 'Vigente',
      lastVisit: 'Sin ingresos',
      email: input.email,
      color: 'blue',
    }
  }

  const { data, error } = await supabase
    .from('members')
    .insert({
      member_number: `S-${Date.now().toString().slice(-6)}`,
      full_name: input.name,
      email: input.email,
      plan_name: input.plan,
    })
    .select('id, member_number, full_name, email, plan_name, membership_status, expires_at')
    .single()

  if (error) throw error
  return toMember(data as MemberRow)
}

export async function updateMember(memberNumber: string, input: { name: string; email: string; plan: string; status: Member['status'] }): Promise<Member> {
  if (!supabase) throw new Error('Supabase no está configurado.')
  const { data, error } = await supabase.from('members').update({
    full_name: input.name.trim(),
    email: input.email.trim(),
    plan_name: input.plan,
    membership_status: input.status,
    updated_at: new Date().toISOString(),
  }).eq('member_number', memberNumber)
    .select('id, member_number, full_name, email, plan_name, membership_status, expires_at')
    .single()
  if (error) throw error
  return toMember(data as MemberRow)
}

export async function listActivePlans(): Promise<Array<{ name: string }>> {
  if (!supabase) return ['Full Access', 'Plan Anual', 'Clases Plus', 'Plan Mensual'].map((name) => ({ name }))
  const { data, error } = await supabase.from('membership_plans').select('name').eq('is_active', true).order('name')
  if (error) throw error
  return data ?? []
}
