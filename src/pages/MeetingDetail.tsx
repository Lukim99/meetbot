import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Edit2, Plus, Trash2, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'
import { useAuth } from '../hooks/useAuth'
import type { Meeting, MeetingItem, User } from '../types'
import { Page } from '../components/ui/Page'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Loading, ErrorState } from '../components/ui/States'
import { MeetingFormModal, type MeetingFormData } from '../components/MeetingFormModal'
import { formatDate, formatWon } from '../lib/format'
import { computeSettlement } from '../lib/settlement'
import { cn } from '../lib/cn'

type Member = Pick<User, 'id' | 'name'>

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function applyDeadline(startISO: string, offset: string): string | null {
  const ms: Record<string, number> = {
    '30m': 30 * 60000, '1h': 3600000, '3h': 10800000, '12h': 43200000, '1d': 86400000,
  }
  const delta = ms[offset]
  return delta ? new Date(new Date(startISO).getTime() - delta).toISOString() : null
}

function formatTimeRange(m: Meeting): string {
  if (!m.start_time) return formatDate(m.date)
  const start = new Date(m.start_time)
  const startTime = start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  if (!m.end_time) return `${formatDate(m.date)} ${startTime}`
  const end = new Date(m.end_time)
  const endTime = end.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  if (toISO(start) === toISO(end)) return `${formatDate(m.date)} ${startTime} ~ ${endTime}`
  return (
    `${start.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} ${startTime}` +
    ` ~ ${end.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} ${endTime}`
  )
}

export default function MeetingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { user, isAdmin } = useAuth()

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [items, setItems] = useState<MeetingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [payer, setPayer] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)

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

  useEffect(() => { load() }, [load])

  const nameOf = useCallback(
    (uid: string | null) => (uid ? members.find((m) => m.id === uid)?.name ?? uid : '공동'),
    [members],
  )

  const settlement = useMemo(
    () => computeSettlement(members.map((m) => m.id), items),
    [members, items],
  )

  if (loading) return <Page><Loading /></Page>
  if (error) return <Page><ErrorState message={error} /></Page>
  if (!meeting) return <Page><ErrorState message="일정을 찾을 수 없습니다" /></Page>

  const now = new Date()
  const isJoined = user ? members.some((m) => m.id === user.id) : false
  const isHost = !!(user && meeting.host_id && user.id === meeting.host_id)
  const canEdit = isHost || isAdmin
  const isPastDeadline = !!meeting.deadline && new Date(meeting.deadline) < now
  const isFull = meeting.max_members != null && members.length >= meeting.max_members

  const joinMeeting = async () => {
    if (!user) return
    const { error: err } = await supabase
      .from('meeting_members')
      .insert({ meeting_id: meeting.id, user_id: user.id })
    if (!err) {
      if (!meeting.host_id) {
        await supabase.from('meetings').update({ host_id: user.id }).eq('id', meeting.id)
      }
      load()
    }
  }

  const leaveMeeting = async () => {
    if (!user) return
    await supabase
      .from('meeting_members')
      .delete()
      .eq('meeting_id', meeting.id)
      .eq('user_id', user.id)
    load()
  }

  const deleteMeeting = async () => {
    if (!confirm('일정을 삭제할까요?')) return
    await supabase.from('meetings').delete().eq('id', meeting.id)
    navigate(isMobile ? '/m/meetings' : '/meetings')
  }

  const handleEdit = async (data: MeetingFormData) => {
    if (!data.name.trim() || !data.startDate) return
    setSaving(true)
    const startISO = new Date(`${data.startDate}T${data.startTime || '00:00'}:00`).toISOString()
    const endISO =
      data.hasEnd && data.endDate
        ? new Date(`${data.endDate}T${data.endTime || '00:00'}:00`).toISOString()
        : null
    const deadline = data.deadlineOffset !== '' ? applyDeadline(startISO, data.deadlineOffset) : null
    await supabase
      .from('meetings')
      .update({
        name: data.name.trim(),
        date: data.startDate,
        start_time: startISO,
        end_time: endISO,
        description: data.desc.trim() || null,
        min_members: data.minMembers ? parseInt(data.minMembers) : null,
        max_members: data.maxMembers ? parseInt(data.maxMembers) : null,
        deadline,
      })
      .eq('id', meeting.id)
    setSaving(false)
    setEditOpen(false)
    load()
  }

  const addItem = async () => {
    if (!id || !label.trim() || !amount) return
    const { error: err } = await supabase.from('meeting_items').insert({
      meeting_id: id,
      label: label.trim(),
      amount: Number(amount),
      payer_id: payer || null,
    })
    if (err) { setError(err.message); return }
    setLabel(''); setAmount(''); setPayer('')
    load()
  }

  const removeItem = async (itemId: string) => {
    await supabase.from('meeting_items').delete().eq('id', itemId)
    load()
  }

  return (
    <Page>
      <button
        onClick={() => navigate(isMobile ? '/m/meetings' : '/meetings')}
        className="mb-4 flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
      >
        <ArrowLeft size={16} />
        일정 목록
      </button>

      {/* header */}
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-[var(--color-text)]">{meeting.name}</h1>
          {meeting.settled ? <Badge tone="success">정산완료</Badge> : <Badge tone="warning">미정산</Badge>}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)]"
            >
              <Edit2 size={12} />
              수정
            </button>
            <button
              onClick={deleteMeeting}
              className="flex items-center gap-1.5 rounded-lg border border-red-800/40 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
            >
              <Trash2 size={12} />
              삭제
            </button>
          </div>
        )}
      </div>

      {/* meta info */}
      <div className="mb-1 flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
        <Clock size={13} />
        {formatTimeRange(meeting)}
      </div>

      {(meeting.min_members || meeting.max_members) && (
        <div className="mb-1 flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
          <Users size={13} />
          {[
            meeting.min_members ? `최소 ${meeting.min_members}명` : '',
            meeting.max_members ? `최대 ${meeting.max_members}명` : '',
          ]
            .filter(Boolean)
            .join(' / ')}
        </div>
      )}

      {meeting.deadline && (
        <p className={cn('mb-1 text-sm', isPastDeadline ? 'text-red-400' : 'text-[var(--color-text-muted)]')}>
          참가 마감{isPastDeadline ? ' (마감됨)' : ''}: {' '}
          {new Date(meeting.deadline).toLocaleDateString('ko-KR', {
            month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </p>
      )}

      {meeting.description && (
        <p className="mt-1 mb-4 text-sm text-[var(--color-text)]">{meeting.description}</p>
      )}

      {/* join / leave */}
      <div className="mb-5 mt-3">
        {isJoined ? (
          <button
            onClick={leaveMeeting}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:border-red-800/60 hover:text-red-400"
          >
            참가 취소
          </button>
        ) : isPastDeadline || isFull ? (
          <span className="text-sm text-[var(--color-text-muted)]">
            {isPastDeadline ? '참가 마감됨' : '인원 마감됨'}
          </span>
        ) : (
          <button
            onClick={joinMeeting}
            className="rounded-lg border border-[var(--color-accent)]/50 px-4 py-2 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/10"
          >
            참가하기
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* members */}
        <Card>
          <h2 className="mb-3 text-base font-medium text-[var(--color-text)]">
            참여 멤버 ({members.length}{meeting.max_members ? `/${meeting.max_members}` : ''})
          </h2>
          <div className="flex flex-wrap gap-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <Avatar name={m.name} size={32} />
                <div>
                  <span className="text-sm text-[var(--color-text)]">{m.name}</span>
                  {m.id === meeting.host_id && (
                    <span className="ml-1.5 text-xs text-[var(--color-accent)]">모임장</span>
                  )}
                </div>
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">아직 참가자가 없습니다</p>
            )}
          </div>
        </Card>

        {/* settlement items */}
        <Card>
          <h2 className="mb-3 text-base font-medium text-[var(--color-text)]">정산 항목</h2>
          <div className="flex flex-col gap-2">
            {items.map((it) => (
              <div
                key={it.id}
                className="flex items-center gap-3 rounded-lg bg-[var(--color-surface-2)] px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-[var(--color-text)]">{it.label}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{nameOf(it.payer_id)} 지불</div>
                </div>
                <span className="shrink-0 text-sm text-[var(--color-text)]">{formatWon(it.amount)}</span>
                <button
                  onClick={() => removeItem(it.id)}
                  aria-label="항목 삭제"
                  className="shrink-0 text-[var(--color-text-muted)] hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">항목이 없습니다</p>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2 pt-3 sm:flex-row" style={{ borderTop: '1px solid var(--color-border)' }}>
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
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none sm:w-32"
            >
              <option value="">공동 (1/N)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <Button onClick={addItem} disabled={!label.trim() || !amount} className="shrink-0">
              <Plus size={16} />
            </Button>
          </div>
        </Card>
      </div>

      {/* settlement summary */}
      <Card className="mt-5">
        <h2 className="mb-3 text-base font-medium text-[var(--color-text)]">정산 요약</h2>
        <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">
            총액 <span className="text-[var(--color-text)]">{formatWon(settlement.total)}</span>
          </span>
          <span className="text-[var(--color-text-muted)]">
            1인당 <span className="text-[var(--color-text)]">{formatWon(settlement.perHead)}</span>
          </span>
        </div>
        {settlement.transfers.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">정산할 내역이 없습니다</p>
        ) : (
          <div className="flex flex-col gap-2">
            {settlement.transfers.map((t, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-sm"
              >
                <span className="font-medium text-[var(--color-text)]">{nameOf(t.from)}</span>
                <span className="text-[var(--color-text-muted)]">→</span>
                <span className="font-medium text-[var(--color-text)]">{nameOf(t.to)}</span>
                <span className="ml-auto text-[var(--color-accent)]">{formatWon(t.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <MeetingFormModal
        open={editOpen}
        meeting={meeting}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
        submitting={saving}
      />
    </Page>
  )
}
