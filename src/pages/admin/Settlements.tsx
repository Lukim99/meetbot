import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Receipt, Users, CalendarDays, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useIsMobile } from '../../hooks/useIsMobile'
import { Page, PageHeader } from '../../components/ui/Page'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Loading, ErrorState, EmptyState } from '../../components/ui/States'
import { formatDate, formatWon } from '../../lib/format'
import { cn } from '../../lib/cn'

interface Row {
  id: string
  name: string
  date: string
  settled: boolean
  count: number
  total: number
}

export default function Settlements() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [onlyUnsettled, setOnlyUnsettled] = useState(false)

  const load = () => {
    setLoading(true)
    supabase
      .from('meetings')
      .select('id, name, date, settled, meeting_members(count), meeting_items(amount)')
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else {
          setRows(
            (data ?? []).map((m: any) => ({
              id: m.id,
              name: m.name,
              date: m.date,
              settled: m.settled,
              count: m.meeting_members?.[0]?.count ?? 0,
              total: (m.meeting_items ?? []).reduce((s: number, it: any) => s + (it.amount ?? 0), 0),
            })) as Row[],
          )
        }
        setLoading(false)
      })
  }
  useEffect(load, [])

  const toggle = async (row: Row, e: React.MouseEvent) => {
    e.stopPropagation()
    await supabase.from('meetings').update({ settled: !row.settled }).eq('id', row.id)
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, settled: !r.settled } : r)))
  }

  const go = (id: string) => navigate(isMobile ? `/m/meetings/${id}` : `/meetings/${id}`)
  const visible = onlyUnsettled ? rows.filter((r) => !r.settled) : rows

  const summary = useMemo(() => {
    const unsettled = rows.filter((r) => !r.settled)
    return {
      count: rows.length,
      unsettled: unsettled.length,
      unsettledTotal: unsettled.reduce((s, r) => s + r.total, 0),
    }
  }, [rows])

  return (
    <Page>
      <PageHeader
        title="모임 정산"
        actions={
          <Button variant={onlyUnsettled ? 'primary' : 'ghost'} onClick={() => setOnlyUnsettled((v) => !v)}>
            미정산만
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          {/* 요약 */}
          <div className="mb-5 grid grid-cols-3 gap-3">
            <SummaryCard label="전체 모임" value={`${summary.count}건`} />
            <SummaryCard label="미정산" value={`${summary.unsettled}건`} tone="warning" />
            <SummaryCard label="미정산 금액" value={formatWon(summary.unsettledTotal)} tone="warning" />
          </div>

          {visible.length === 0 ? (
            <EmptyState icon={Receipt} message="표시할 모임이 없습니다" />
          ) : isMobile ? (
            /* 모바일: 카드 리스트 */
            <div className="flex flex-col gap-3">
              {visible.map((r) => (
                <button
                  key={r.id}
                  onClick={() => go(r.id)}
                  className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition-colors hover:bg-[var(--color-surface-2)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0 flex-1 truncate font-semibold text-[var(--color-text)]">{r.name}</span>
                    <StatusToggle row={r} onToggle={toggle} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={13} />
                      {formatDate(r.date)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users size={13} />
                      {r.count}명
                    </span>
                  </div>
                  <div
                    className="flex items-baseline justify-between pt-3"
                    style={{ borderTop: '1px solid var(--color-border)' }}
                  >
                    <span className="text-xs text-[var(--color-text-muted)]">총액</span>
                    <span className="text-base font-bold text-[var(--color-text)]">{formatWon(r.total)}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* PC: 테이블 */
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-text-muted)]">
                    <th className="px-4 py-3 text-left">모임 이름</th>
                    <th className="w-36 px-4 py-3 text-left">날짜</th>
                    <th className="w-20 px-4 py-3 text-right">인원</th>
                    <th className="w-36 px-4 py-3 text-right">총액</th>
                    <th className="w-32 px-4 py-3 text-center">상태</th>
                    <th className="w-10 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => go(r.id)}
                      className="group cursor-pointer border-b border-[var(--color-border)] transition-colors last:border-b-0 hover:bg-[var(--color-surface-2)]"
                    >
                      <td className="px-4 py-3 font-medium text-[var(--color-text)]">{r.name}</td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{formatDate(r.date)}</td>
                      <td className="px-4 py-3 text-right text-[var(--color-text-muted)]">{r.count}</td>
                      <td className="px-4 py-3 text-right font-medium text-[var(--color-text)]">{formatWon(r.total)}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusToggle row={r} onToggle={toggle} />
                      </td>
                      <td className="px-2 py-3 text-right">
                        <ChevronRight size={16} className="text-[var(--color-text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Page>
  )
}

function StatusToggle({ row, onToggle }: { row: Row; onToggle: (row: Row, e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={(e) => onToggle(row, e)}
      className="shrink-0 transition-opacity hover:opacity-80"
      aria-label="정산 상태 토글"
    >
      {row.settled ? <Badge tone="success">정산완료</Badge> : <Badge tone="warning">미정산</Badge>}
    </button>
  )
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone?: 'warning' }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4">
      <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
      <div className={cn('mt-1 truncate text-base font-bold sm:text-lg', tone === 'warning' ? 'text-orange-400' : 'text-[var(--color-text)]')}>
        {value}
      </div>
    </div>
  )
}
