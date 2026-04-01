'use client'
import { useState, useCallback } from 'react'
import { parseRevenueTsv }         from '@/lib/parsers/revenueParser'
import { parseRevisitTsv }          from '@/lib/parsers/revisitParser'
import { parsePharmaOutpatientTsv } from '@/lib/parsers/pharmaOutpatientParser'
import { parseRegionalSupportTsv }  from '@/lib/parsers/regionalSupportParser'

type Tab = 'revenue' | 'revisit' | 'pharma_out' | 'pharma_home' | 'regional'

const TABS: { key: Tab; label: string; hint: string }[] = [
  { key: 'revenue',     label: '収益系分析',          hint: '「収益系分析」レポートをコピー＆ペーストしてください' },
  { key: 'revisit',     label: '次回再来分析',         hint: '「次回再来分析」レポートをコピー＆ペーストしてください（1行目フィルター条件含む）' },
  { key: 'pharma_out',  label: '薬学管理料（外来）',   hint: '「薬学管理料_外来」レポートをコピー＆ペーストしてください' },
  { key: 'pharma_home', label: '薬学管理料（在宅）',   hint: '「薬学管理料_在宅」レポートをコピー＆ペーストしてください' },
  { key: 'regional',    label: '地域支援体制加算',      hint: '「地域支援体制加算の算定実績」レポートをコピー＆ペーストしてください' },
]

type SaveStatus = 'idle' | 'saving' | 'ok' | 'error'

export default function DataInputClient({ stores }: { stores: { id: string; name: string; store_code: string }[] }) {
  const [activeTab, setActiveTab]   = useState<Tab>('revenue')
  const [yearMonth, setYearMonth]   = useState<string>(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`
  })
  const [pasteText, setPasteText]   = useState<Record<Tab, string>>({
    revenue: '', revisit: '', pharma_out: '', pharma_home: '', regional: ''
  })
  const [previews, setPreviews]     = useState<Record<Tab, unknown[]>>({
    revenue: [], revisit: [], pharma_out: [], pharma_home: [], regional: []
  })
  const [status, setStatus]         = useState<Record<Tab, SaveStatus>>({
    revenue: 'idle', revisit: 'idle', pharma_out: 'idle', pharma_home: 'idle', regional: 'idle'
  })
  const [statusMsg, setStatusMsg]   = useState<Record<Tab, string>>({
    revenue: '', revisit: '', pharma_out: '', pharma_home: '', regional: ''
  })

  const parse = useCallback((tab: Tab, text: string) => {
    try {
      switch (tab) {
        case 'revenue':     return parseRevenueTsv(text)
        case 'revisit':     return parseRevisitTsv(text)
        case 'pharma_out':  return parsePharmaOutpatientTsv(text)
        case 'pharma_home': return []  // pharmaHomeParser は同じ構造
        case 'regional':    return parseRegionalSupportTsv(text)
        default:            return []
      }
    } catch { return [] }
  }, [])

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData('text')
    setPasteText(prev => ({ ...prev, [activeTab]: text }))
    const rows = parse(activeTab, text)
    setPreviews(prev => ({ ...prev, [activeTab]: rows }))
    setStatus(prev => ({ ...prev, [activeTab]: 'idle' }))
    setStatusMsg(prev => ({ ...prev, [activeTab]: `${rows.length}件を認識しました` }))
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value
    setPasteText(prev => ({ ...prev, [activeTab]: text }))
    if (text.includes('\t')) {
      const rows = parse(activeTab, text)
      setPreviews(prev => ({ ...prev, [activeTab]: rows }))
      setStatusMsg(prev => ({ ...prev, [activeTab]: `${rows.length}件を認識しました` }))
    }
  }

  async function handleSave() {
    const rows = previews[activeTab]
    if (!rows.length) return
    if (!yearMonth) { alert('年月を選択してください'); return }

    setStatus(prev => ({ ...prev, [activeTab]: 'saving' }))
    try {
      const res = await fetch('/api/data/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, yearMonth, rows }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Unknown error')
      setStatus(prev => ({ ...prev, [activeTab]: 'ok' }))
      setStatusMsg(prev => ({ ...prev, [activeTab]: `✓ ${json.savedCount}件を保存しました` }))
    } catch (err) {
      setStatus(prev => ({ ...prev, [activeTab]: 'error' }))
      setStatusMsg(prev => ({ ...prev, [activeTab]: `エラー: ${(err as Error).message}` }))
    }
  }

  const currentRows = previews[activeTab] as Record<string, unknown>[]
  const previewCols = currentRows.length ? Object.keys(currentRows[0]).slice(0, 6) : []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">データ入力</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">対象年月</label>
          <input
            type="month"
            value={yearMonth}
            onChange={e => setYearMonth(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {TABS.map(tab => {
          const s = status[tab.key]
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors relative ${
                activeTab === tab.key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {s === 'ok' && <span className="ml-1.5 text-green-500 text-xs">✓</span>}
              {s === 'error' && <span className="ml-1.5 text-red-500 text-xs">✗</span>}
            </button>
          )
        })}
      </div>

      {/* ヒント */}
      <p className="text-sm text-gray-500 mb-3">
        {TABS.find(t => t.key === activeTab)?.hint}
      </p>

      {/* 貼り付けエリア */}
      <div className="card mb-4">
        <textarea
          value={pasteText[activeTab]}
          onPaste={handlePaste}
          onChange={handleChange}
          placeholder={`ここにデータを貼り付けてください（Ctrl+V）\n\n管理システムの該当レポートを全選択してコピーし、このエリアに貼り付けてください。`}
          className="w-full h-36 text-sm font-mono border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 placeholder-gray-300"
        />
        <div className="flex items-center justify-between mt-3">
          <span className={`text-sm ${
            status[activeTab] === 'ok'    ? 'text-green-600' :
            status[activeTab] === 'error' ? 'text-red-600' : 'text-gray-500'
          }`}>
            {statusMsg[activeTab]}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setPasteText(prev => ({ ...prev, [activeTab]: '' }))
                setPreviews(prev => ({ ...prev, [activeTab]: [] }))
                setStatus(prev => ({ ...prev, [activeTab]: 'idle' }))
                setStatusMsg(prev => ({ ...prev, [activeTab]: '' }))
              }}
              className="btn-secondary"
            >
              クリア
            </button>
            <button
              onClick={handleSave}
              disabled={!currentRows.length || status[activeTab] === 'saving'}
              className="btn-primary"
            >
              {status[activeTab] === 'saving' ? '保存中...' : `${currentRows.length}件を保存`}
            </button>
          </div>
        </div>
      </div>

      {/* プレビューテーブル */}
      {currentRows.length > 0 && (
        <div className="card overflow-x-auto">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            プレビュー（先頭 5 件）
          </p>
          <table className="text-xs w-full min-w-max">
            <thead>
              <tr className="border-b border-gray-200">
                {previewCols.map(col => (
                  <th key={col} className="py-1.5 px-2 text-left text-gray-500 font-medium whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentRows.slice(0, 5).map((row, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {previewCols.map(col => (
                    <td key={col} className="py-1.5 px-2 text-gray-700 whitespace-nowrap">
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {currentRows.length > 5 && (
            <p className="text-xs text-gray-400 mt-2">... 他 {currentRows.length - 5} 件</p>
          )}
        </div>
      )}

      {/* 全データ保存後の偏差値再計算ボタン */}
      {Object.values(status).filter(s => s === 'ok').length >= 3 && (
        <div className="card mt-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-900">偏差値を再計算する</p>
              <p className="text-xs text-blue-600 mt-0.5">
                3種類以上のデータを保存しました。偏差値・順位を更新してください。
              </p>
            </div>
            <RecalcButton yearMonth={yearMonth} />
          </div>
        </div>
      )}
    </div>
  )
}

function RecalcButton({ yearMonth }: { yearMonth: string }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleRecalc() {
    setLoading(true)
    setMsg('')
    try {
      const res = await fetch('/api/calculate-deviations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yearMonth }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setMsg(`✓ ${json.count}店舗の偏差値を更新しました`)
    } catch (err) {
      setMsg(`エラー: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-sm text-blue-700">{msg}</span>}
      <button onClick={handleRecalc} disabled={loading} className="btn-primary">
        {loading ? '計算中...' : '偏差値を計算・保存'}
      </button>
    </div>
  )
}
