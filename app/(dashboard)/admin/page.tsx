import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ data: users }, { data: stores }] = await Promise.all([
    supabase.from('users').select('*, stores(name)').order('created_at'),
    supabase.from('stores').select('*').order('name'),
  ])

  return <AdminClient users={users ?? []} stores={stores ?? []} />
}
