import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { UserRole } from '../../data/roles'

export interface AppProfile {
  id: string
  email: string
  full_name: string
  phone: string | null
  avatar_url: string | null
}

export interface AppAccount {
  profile: AppProfile
  role: UserRole
  memberId: string | null
}

type StaffRow = { role: 'owner' | 'admin' | 'receptionist' | 'trainer' | 'maintenance' }
type MemberRow = { id: string }

export async function loadAccount(user: User): Promise<AppAccount | null> {
  if (!supabase) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,email,full_name,phone,avatar_url')
    .eq('id', user.id)
    .single()

  if (profileError) throw profileError

  const { data: staff, error: staffError } = await supabase
    .from('gym_staff')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (staffError) throw staffError

  const normalizedStaffRole: Record<StaffRow['role'], UserRole> = {
    owner: 'owner', admin: 'owner', receptionist: 'reception', trainer: 'trainer', maintenance: 'maintenance',
  }

  if (staff) {
    return { profile: profile as AppProfile, role: normalizedStaffRole[(staff as StaffRow).role], memberId: null }
  }

  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (memberError) throw memberError
  if (!member) return null

  return { profile: profile as AppProfile, role: 'member', memberId: (member as MemberRow).id }
}

export async function updateProfile(input: { fullName: string; phone: string }) {
  if (!supabase) throw new Error('Supabase no está configurado.')
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('La sesión expiró. Inicia sesión de nuevo.')

  const { error } = await supabase.from('profiles').update({
    full_name: input.fullName.trim(),
    phone: input.phone.trim() || null,
    updated_at: new Date().toISOString(),
  }).eq('id', user.id)
  if (error) throw error

  const staff = await supabase.from('gym_staff').select('role').eq('user_id', user.id).maybeSingle()
  if (staff.error) throw staff.error
  if (staff.data) {
    const staffUpdate = await supabase.from('gym_staff').update({ full_name: input.fullName.trim() }).eq('user_id', user.id)
    if (staffUpdate.error) throw staffUpdate.error
    if (staff.data.role === 'trainer') {
      const trainerUpdate = await supabase.from('trainer_profiles').update({ display_name: input.fullName.trim(), updated_at: new Date().toISOString() }).eq('user_id', user.id)
      if (trainerUpdate.error) throw trainerUpdate.error
    }
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: input.fullName.trim(), phone: input.phone.trim() },
  })
  if (authError) throw authError
}

export async function updatePassword(password: string) {
  if (!supabase) throw new Error('Supabase no está configurado.')
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}
