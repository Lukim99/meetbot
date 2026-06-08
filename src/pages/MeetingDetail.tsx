import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'
import type { Meeting, MeetingItem, User } from '../types'
import { Page } from '../components/ui/Page'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Loading, ErrorState } from '../components/ui/States'
import { formatDate, formatWon } from '../lib/format'
import { computeSettlement } from '../lib/settlement'

type Member = Pick<User, 'id' | 'name'>

export default function MeetingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [items, setItems] = useState<MeetingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [payer, setPayer] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const [m, mm, it] = await Promise.all([
      supabase.from('meetings').select('*').eq('id', id).maybeSingle(),
      supabase.from('meeting_members').select('user_id, users(id, name)').eq('meeting_id', id),
      supabase.from('meeting_items').select('*').eq('meeting_id', id),
    ])
    if (m.error) setError(m.error.message)
    else setMeeting(m.data as Meeting)
    setMembers(((mm.data ?? []).map((r: any) => r.users).filter(Boolean)) as Member[])
    setItems((it.data ?? []) as MeetingItem[])
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const nameOf = useCallback(
    (uid: string | null) => (uid ? members.find((m) => m.id === uid)?.name ?? uid : '공동'),
    [members],
  )

  const settlement = useMemo(
    () => computeSettlement(members.map((m) => m.id), items),
    [members, items],
  )

  const addItem = async () => {
    if (!id || !label.trim() || !amount) return
    const { error } = await supabase.from('meeting_items').insert({
      meeting_id: id,
      label: label.trim(),
      amount: Number(amount),
      payer_id: payer || null,
    })
    if (error) {
      setError(error.message)
      return
    }
    setLabel('')
    setAmount('')
    setPayer('')
    load()
  }

  const removeItem = async (itemId: string) => {
    await supabase.from('meeting_items').delete().eq('id', itemId)
    load()
  }

  if (loading) return <Page><Loading /></Page>
  if (error) return <Page><ErrorState message={error} /></Page>
  if (!meeting) return <Page><ErrorState message="모임을 찾을 수 없습니다" /></Page>

  return (
    <Page>
      <button
        onClick={() => navigate(isMobile ? '/m/meetings' : '/meetings')}
        className="mb-4 flex items-center gap-1.5 text-sm text-[--color-text-muted] hover:text-[--color-text] transition-colors"
      >
        <ArrowLeft size={16} />
        모임 목록
      </button>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-[--color-text]">{meeting.name}</h1>
        {meeting.settled ? <Badge tone="success">정산완료</Badge> : <Badge tone="warning">미정산</Badge>}
      </div>
      <p className="mb-1 text-sm text-[--color-text-muted]">{formatDate(meeting.date)}</p>
      {meeting.description && (
        <p className="mb-5 text-sm text-[--color-text]">{meeting.description}</p>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-medium text-[--color-text]">참여 멤버 ({members.length})</h2>
            <Button variant="ghost" onClick={() => setAddOpen(true)} className="px-3 py-1.5">
              <UserPlus size={14} />
              추가
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <Avatar name={m.name} size={32} />
                <span className="text-sm text-[--color-text]">{m.name}</span>
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-sm text-[--color-text-muted]">멤버가 없습니다</p>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-base font-medium text-[--color-text]">정산 항목</h2>
          <div className="flex flex-col gap-2">
            {items.map((it) => (
              <div
                key={it.id}
                className="flex items-center gap-3 rounded-lg bg-[--color-surface-2] px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-[--color-text]">{it.label}</div>
                  <div className="text-xs text-[--color-text-muted]">{nameOf(it.payer_id)} 지불</div>
                </div>
                <span className="shrink-0 text-sm text-[--color-text]">{formatWon(it.amount)}</span>
                <button
                  onClick={() => removeItem(it.id)}
                  aria-label="항목 삭제"
                  className="shrink-0 text-[--color-text-muted] hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-[--color-text-muted]">항목이 없습니다</p>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-[--color-border] pt-3 sm:flex-row">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="항목명"
              className="sm:flex-1"
            />
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
              placeholder="금액"
              inputMode="numeric"
              className="sm:w-28"
            />
            <select
              value={payer}
              onChange={(e) => setPayer(e.target.value)}
              className="rounded-lg border border-[--color-border] bg-[--color-surface-2] px-3 py-2 text-sm text-[--color-text] focus:border-[--color-accent] focus:outline-none sm:w-32"
            >
              <option value="">공동 (1/N)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <Button onClick={addItem} disabled={!label.trim() || !amount} className="shrink-0">
              <Plus size={16} />
            </Button>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <h2 className="mb-3 text-base font-medium text-[--color-text]">정산 요약</h2>
        <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="text-[--color-text-muted]">
            총액 <span className="text-[--color-text]">{formatWon(settlement.total)}</span>
          </span>
          <span className="text-[--color-text-muted]">
            1인당 <span className="text-[--color-text]">{formatWon(settlement.perHead)}</span>
          </span>
        </div>
        {settlement.transfers.length === 0 ? (
          <p className="text-sm text-[--color-text-muted]">정산할 내역이 없습니다</p>
        ) : (
          <div className="flex flex-col gap-2">
            {settlement.transfers.map((t, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg bg-[--color-surface-2] px-3 py-2 text-sm"
              >
                <span className="font-medium text-[--color-text]">{nameOf(t.from)}</span>
                <span className="text-[--color-text-muted]">→</span>
                <span className="font-medium text-[--color-text]">{nameOf(t.to)}</span>
                <span className="ml-auto text-[--color-accent]">{formatWon(t.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <AddMemberModal
        open={addOpen}
        meetingId={id!}
        existing={members.map((m) => m.id)}
        onClose={() => setAddOpen(false)}
        onAdded={() => {
          setAddOpen(false)
          load()
        }}
      />
    </Page>
  )
}

function AddMemberModal({
  open,
  meetingId,
  existing,
  onClose,
  onAdded,
}: {
  open: boolean
  meetingId: string
  existing: string[]
  onClose: () => void
  onAdded: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Member[]>([])

  useEffect(() => {
    if (!open) return
    const q = query.trim()
    supabase
      .from('users')
      .select('id, name')
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(20)
      .then(({ data }) => setResults((data ?? []) as Member[]))
  }, [open, query])

  const add = async (uid: string) => {
    await supabase.from('meeting_members').insert({ meeting_id: meetingId, user_id: uid })
    onAdded()
  }

  return (
    <Modal open={open} title="멤버 추가" onClose={onClose}>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="이름 검색"
        className="mb-3"
        autoFocus
      />
      <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
        {results
          .filter((r) => !existing.includes(r.id))
          .map((r) => (
            <button
              key={r.id}
              onClick={() => add(r.id)}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[--color-surface-2]"
            >
              <Avatar name={r.name} size={28} />
              <span className="text-sm text-[--color-text]">{r.name}</span>
            </button>
          ))}
        {results.filter((r) => !existing.includes(r.id)).length === 0 && (
          <p className="py-4 text-center text-sm text-[--color-text-muted]">결과가 없습니다</p>
        )}
      </div>
    </Modal>
  )
}
