import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Receipt } from 'lucide-react'
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
      ) : visible.length === 0 ? (
        <EmptyState icon={Receipt} message="표시할 모임이 없습니다" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[--color-border]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[--color-border] text-xs uppercase text-[--color-text-muted]">
                <th className="px-4 py-3 text-left">모임 이름</th>
                <th className="w-32 px-4 py-3 text-left">날짜</th>
                <th className="w-20 px-4 py-3 text-right">인원</th>
                <th className="w-32 px-4 py-3 text-right">총액</th>
                <th className="w-28 px-4 py-3 text-center">상태</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => go(r.id)}
                  className="cursor-pointer border-b border-[--color-border] transition-colors hover:bg-[--color-surface-2]"
                >
                  <td className="px-4 py-3 font-medium text-[--color-text]">{r.name}</td>
                  <td className="px-4 py-3 text-[--color-text-muted]">{formatDate(r.date)}</td>
                  <td className="px-4 py-3 text-right text-[--color-text-muted]">{r.count}</td>
                  <td className="px-4 py-3 text-right text-[--color-text]">{formatWon(r.total)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => toggle(r, e)}
                      className={cn('transition-opacity hover:opacity-80')}
                      aria-label="정산 상태 토글"
                    >
                      {r.settled ? (
                        <Badge tone="success">정산완료</Badge>
                      ) : (
                        <Badge tone="warning">미정산</Badge>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  )
}
