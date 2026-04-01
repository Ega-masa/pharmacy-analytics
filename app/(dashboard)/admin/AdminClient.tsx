'use client'
import { useState } from 'react'

type User = {
  id: string; email: string; name: string | null; role: string;
  store_id: string | null; stores?: { name: string } | null
  created_at: string
}
type Store = { id: string; name: string; store_code: string | null; level1: string | null; level2: string | null; is_active: boolean }

const ROLE_LABELS: Record<string, string> = {
  admin: '管理者', store_manager: '店舗', individual: '個人', data_entry: '入力担当'
}

export default function AdminClient({ users: initUsers, stores }: { users: User[]; stores: Store[] }) {
  const [activeTab, setActiveTab] = useState<'users' | 'stores'>('users')
  const [users, setUsers]         = useState(initUsers)
  const [storeList, setStoreList] = useState(stores)
  const [showAddUser, setShowAddUser]   = useState(false)
  const [showAddStore, setShowAddStore] = useState(false)
  const [msg, setMsg] = useState('')

  // --- ユーザー作成 ---
  async function handleAddUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:    fd.get('email'),
        password: fd.get('password'),
        name:     fd.get('name'),
        role:     fd.get('role'),
        store_id: fd.get('store_id') || null,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setMsg('エラー: ' + json.error); return }
    setMsg('✓ ユーザーを作成しました')
    setShowAddUser(false)
    const { data } = await (await fetch('/api/admin/users')).json()
    if (data) setUsers(data)
  }

  // --- 店舗作成 ---
  async function handleAddStore(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/admin/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:       fd.get('name'),
        store_code: fd.get('store_code') || null,
        level1:     fd.get('level1') || null,
        level2:     fd.get('level2') || null,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setMsg('エラー: ' + json.error); return }
    setMsg('✓ 店舗を追加しました')
    setShowAddStore(false)
    setStoreList(prev => [...prev, json.store])
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">管理</h1>
        {msg && <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-lg">{msg}</span>}
      </div>

      {/* タブ */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['users','stores'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab === 'users' ? 'ユーザー管理' : '店舗マスタ'}
          </button>
        ))}
      </div>

      {/* ユーザー管理タブ */}
      {activeTab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{users.length}名のユーザー</p>
            <button onClick={() => setShowAddUser(true)} className="btn-primary">+ ユーザー追加</button>
          </div>

          {showAddUser && (
            <form onSubmit={handleAddUser} className="card mb-4 border-2 border-brand/20">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">新規ユーザー</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">メールアドレス *</label>
                  <input name="email" type="email" required className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">初期パスワード *</label>
                  <input name="password" type="password" required minLength={8} className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">表示名</label>
                  <input name="name" type="text" className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">ロール *</label>
                  <select name="role" required className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    <option value="store_manager">店舗</option>
                    <option value="individual">個人</option>
                    <option value="data_entry">入力担当</option>
                    <option value="admin">管理者</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">担当店舗（店舗・個人ロール用）</label>
                  <select name="store_id" className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg">
                    <option value="">なし</option>
                    {storeList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <button type="button" onClick={() => setShowAddUser(false)} className="btn-secondary">キャンセル</button>
                <button type="submit" className="btn-primary">作成</button>
              </div>
            </form>
          )}

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  {['名前','メールアドレス','ロール','担当店舗','作成日'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium">{u.name ?? '-'}</td>
                    <td className="py-2.5 px-3 text-gray-600">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'store_manager' ? 'bg-blue-100 text-blue-700' :
                        u.role === 'individual' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{ROLE_LABELS[u.role]}</span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">{u.stores?.name ?? '-'}</td>
                    <td className="py-2.5 px-3 text-gray-400 text-xs">{u.created_at.slice(0,10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 店舗マスタタブ */}
      {activeTab === 'stores' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{storeList.length}店舗</p>
            <button onClick={() => setShowAddStore(true)} className="btn-primary">+ 店舗追加</button>
          </div>

          {showAddStore && (
            <form onSubmit={handleAddStore} className="card mb-4 border-2 border-brand/20">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">新規店舗</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">店舗名 *</label>
                  <input name="name" type="text" required className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">お客様管理番号（store_code）</label>
                  <input name="store_code" type="text" className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg" placeholder="例: 1月1日" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">エリア（Level1）</label>
                  <input name="level1" type="text" className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">サブエリア（Level2）</label>
                  <input name="level2" type="text" className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <button type="button" onClick={() => setShowAddStore(false)} className="btn-secondary">キャンセル</button>
                <button type="submit" className="btn-primary">追加</button>
              </div>
            </form>
          )}

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  {['店舗名','管理番号','エリア','サブエリア','状態'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {storeList.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium">{s.name}</td>
                    <td className="py-2.5 px-3 text-gray-500 font-mono text-xs">{s.store_code ?? '-'}</td>
                    <td className="py-2.5 px-3 text-gray-600">{s.level1 ?? '-'}</td>
                    <td className="py-2.5 px-3 text-gray-600">{s.level2 ?? '-'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.is_active ? '有効' : '無効'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
