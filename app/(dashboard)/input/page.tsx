import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DataInputClient from './DataInputClient'

export default async function InputPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['admin','data_entry'].includes(profile?.role ?? '')) redirect('/dashboard')

  const { data: stores } = await supabase
    .from('stores').select('id, name, store_code').eq('is_active', true).order('name')

  return <DataInputClient stores={stores ?? []} />
}
