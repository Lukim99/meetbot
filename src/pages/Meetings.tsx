import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cake, CalendarDays, ChevronLeft, ChevronRight, Clock, Edit2, Plus, Trash2, Users, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'
import { useAuth } from '../hooks/useAuth'
import type { Meeting } from '../types'
import { Page, PageHeader } from '../components/ui/Page'
import { Button } from '../components/ui/Button'
import { Loading, ErrorState } from '../components/ui/States'
import { MeetingFormModal, type MeetingFormData } from '../components/MeetingFormModal'
import { cn } from '../lib/cn'

// ─── types ────────────────────────────────────────────────────────────────────

type MeetingBar = { meeting: Meeting; type: 'start' | 'mid' | 'end' }
type DateData = { hasSingleDay: boolean; bars: MeetingBar[] }
type BirthdayEntry = { name: string; md: string } // md = "MM-DD"

// ─── helpers ─────────────────────────────────────────────────────────────────

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildCells(year: number, month: number) {
  const startOffset = new Date(year, month, 1).getDay()
  const start = new Date(year, month, 1 - startOffset)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return { date: d, dateStr: toISO(d), isCurrentMonth: d.getMonth() === month }
  })
}

function applyDeadline(startISO: string, offset: string): string | null {
  if (!offset || !startISO) return null
  const ms: Record<string, number> = {
    '30m': 30 * 60000,
    '1h': 3600000,
    '3h': 10800000,
    '12h': 43200000,
    '1d': 86400000,
  }
  const delta = ms[offset]
  return delta ? new Date(new Date(startISO).getTime() - delta).toISOString() : null
}

function formatTimeRange(m: Meeting): string {
  if (!m.start_time) return ''
  const start = new Date(m.start_time)
  const startTime = start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  if (!m.end_time) return startTime
  const end = new Date(m.end_time)
  const endTime = end.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  if (toISO(start) === toISO(end)) return `${startTime} ~ ${endTime}`
  return `${startTime} ~ ${end.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} ${endTime}`
}

// ─── DayPanel ─────────────────────────────────────────────────────────────────

interface DayPanelProps {
  dateStr: string
  panelIn: boolean
  meetings: Meeting[]
  memberCounts: Record<string, number>
  joinedIds: Set<string>
  isMobile: boolean
  currentUserId: string | undefined
  isAdmin: boolean
  birthdayNames: string[]
  onClose: () => void
  onAdd: () => void
  onGo: (id: string) => void
  onJoin: (id: string) => void
  onLeave: (id: string) => void
  onEdit: (m: Meeting) => void
  onDelete: (id: string) => void
}

function DayPanel({
  dateStr, panelIn, meetings, memberCounts, joinedIds, isMobile,
  currentUserId, isAdmin, birthdayNames, onClose, onAdd, onGo, onJoin, onLeave, onEdit, onDelete,
}: DayPanelProps) {
  const now = new Date()
  const [y, m, d] = dateStr.split('-')
  const label = new Date(+y, +m - 1, +d).toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short',
  })

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300',
          panelIn ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed z-[60] bg-[--color-surface] transition-transform duration-300 ease-out',
          isMobile
            ? 'inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-2xl'
            : 'right-0 top-0 h-full w-[22rem] overflow-y-auto shadow-2xl',
          isMobile
            ? panelIn ? 'translate-y-0' : 'translate-y-full'
            : panelIn ? 'translate-x-0' : 'translate-x-full',
        )}
        style={isMobile
          ? { borderTop: '1px solid rgba(255,255,255,0.08)' }
          : { borderLeft: '1px solid rgba(255,255,255,0.08)' }
        }
      >
        {isMobile && (
          <div className="flex justify-center pb-1 pt-3">
            <div className="h-1 w-10 rounded-full bg-white/[.15]" />
          </div>
        )}

        <div className="sticky top-0 z-10 flex items-center justify-between bg-[--color-surface] px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[--color-text-muted]">선택한 날짜</p>
            <h2 className="mt-0.5 text-base font-semibold text-[--color-text]">{label}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 rounded-lg border border-[--color-accent]/50 px-2.5 py-1.5 text-xs text-[--color-accent] transition-colors hover:bg-[--color-accent]/10"
            >
              <Plus size={11} />
              일정 추가
            </button>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[--color-text-muted] transition-colors hover:bg-[--color-surface-2]"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4">
          {birthdayNames.length > 0 && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.15)' }}
            >
              <Cake size={15} className="shrink-0 text-amber-400/80" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-amber-400/90">오늘 생일 🎂</p>
                <p className="truncate text-xs text-[--color-text-muted]">{birthdayNames.join(', ')}</p>
              </div>
            </div>
          )}

          {meetings.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[--color-surface-2]">
                <CalendarDays size={22} className="text-[--color-text-muted]" />
              </div>
              <p className="text-sm text-[--color-text-muted]">이 날 등록된 일정이 없습니다</p>
            </div>
          )}

          {meetings.map((mtg) => {
            const count = memberCounts[mtg.id] ?? 0
            const isJoined = joinedIds.has(mtg.id)
            const isHost = currentUserId === mtg.host_id
            const canEdit = isHost || isAdmin
            const isPastDeadline = !!mtg.deadline && new Date(mtg.deadline) < now
            const isFull = mtg.max_members != null && count >= mtg.max_members

            return (
              <div key={mtg.id} className="rounded-xl bg-[--color-surface-2] p-4" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <button
                    onClick={() => onGo(mtg.id)}
                    className="min-w-0 text-left text-sm font-medium text-[--color-text] transition-colors hover:text-[--color-accent]"
                  >
                    {mtg.name}
                  </button>
                  {canEdit && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => onEdit(mtg)}
                        aria-label="수정"
                        className="rounded p-1 text-[--color-text-muted] transition-colors hover:bg-[--color-surface] hover:text-[--color-accent]"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => onDelete(mtg.id)}
                        aria-label="삭제"
                        className="rounded p-1 text-[--color-text-muted] transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {mtg.start_time && (
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs text-[--color-text-muted]">
                    <Clock size={11} />
                    {formatTimeRange(mtg)}
                  </div>
                )}

                <div className="mb-3 flex items-center gap-1.5 text-xs text-[--color-text-muted]">
                  <Users size={11} />
                  {count}명 참가
                  {mtg.max_members ? ` / 최대 ${mtg.max_members}명` : ''}
                  {mtg.min_members ? ` (최소 ${mtg.min_members}명)` : ''}
                </div>

                {mtg.deadline && (
                  <p className={cn('mb-3 text-xs', isPastDeadline ? 'text-red-400' : 'text-[--color-text-muted]')}>
                    마감{' '}
                    {isPastDeadline
                      ? '(마감됨)'
                      : new Date(mtg.deadline).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                  </p>
                )}

                {isJoined ? (
                  <button
                    onClick={() => onLeave(mtg.id)}
                    className="w-full rounded-lg border border-white/[.10] py-1.5 text-xs text-[--color-text-muted] transition-colors hover:border-red-800/60 hover:text-red-400"
                  >
                    참가 취소
                  </button>
                ) : isPastDeadline || isFull ? (
                  <div className="w-full rounded-lg bg-[--color-surface] py-1.5 text-center text-xs text-[--color-text-muted]">
                    {isPastDeadline ? '참가 마감' : '인원 마감'}
                  </div>
                ) : (
                  <button
                    onClick={() => onJoin(mtg.id)}
                    className="w-full rounded-lg border border-[--color-accent]/50 py-1.5 text-xs font-medium text-[--color-accent] transition-colors hover:bg-[--color-accent]/10"
                  >
                    참가하기
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function Meetings() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { user, isAdmin } = useAuth()

  const today = new Date()
  const todayStr = toISO(today)

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({})
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [birthdays, setBirthdays] = useState<BirthdayEntry[]>([])

  const [panelDate, setPanelDate] = useState<string | null>(null)
  const [panelIn, setPanelIn] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [formDate, setFormDate] = useState(todayStr)
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const cells = useMemo(() => buildCells(year, month), [year, month])

  const dateMap = useMemo<Record<string, DateData>>(() => {
    const map: Record<string, DateData> = {}
    for (const m of meetings) {
      const startStr = m.start_time ? toISO(new Date(m.start_time)) : m.date
      const endStr = m.end_time ? toISO(new Date(m.end_time)) : startStr

      if (startStr === endStr) {
        if (!map[startStr]) map[startStr] = { hasSingleDay: false, bars: [] }
        map[startStr].hasSingleDay = true
      } else {
        const cur = new Date(startStr)
        while (toISO(cur) <= endStr) {
          const d = toISO(cur)
          if (!map[d]) map[d] = { hasSingleDay: false, bars: [] }
          const type: 'start' | 'mid' | 'end' = d === startStr ? 'start' : d === endStr ? 'end' : 'mid'
          map[d].bars.push({ meeting: m, type })
          cur.setDate(cur.getDate() + 1)
        }
      }
    }
    return map
  }, [meetings])

  const birthdayMap = useMemo<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {}
    for (const bd of birthdays) {
      if (!map[bd.md]) map[bd.md] = []
      map[bd.md].push(bd.name)
    }
    return map
  }, [birthdays])

  const load = async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const [{ data: meetData, error: meetErr }, { data: memData }, { data: myData }, { data: bdData }] = await Promise.all([
      supabase.from('meetings').select('*').order('date'),
      supabase.from('meeting_members').select('meeting_id'),
      supabase.from('meeting_members').select('meeting_id').eq('user_id', user.id),
      supabase.from('users').select('id, name, kakao_name, birthday').not('birthday', 'is', null).neq('birthday', ''),
    ])

    if (meetErr) { setError(meetErr.message); setLoading(false); return }
    setMeetings((meetData ?? []) as Meeting[])

    const counts: Record<string, number> = {}
    for (const r of memData ?? []) counts[r.meeting_id] = (counts[r.meeting_id] ?? 0) + 1
    setMemberCounts(counts)

    setJoinedIds(new Set((myData ?? []).map((r: { meeting_id: string }) => r.meeting_id)))

    const bds: BirthdayEntry[] = []
    for (const u of bdData ?? []) {
      const bd = u.birthday as string
      let md = ''
      if (bd.length === 10 && bd[4] === '.') {
        md = `${bd.slice(5, 7)}-${bd.slice(8, 10)}`
      } else if (bd.length === 6) {
        md = `${bd.slice(2, 4)}-${bd.slice(4, 6)}`
      }
      if (md) bds.push({ name: (u.kakao_name || u.name) as string, md })
    }
    setBirthdays(bds)

    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const openPanel = (dateStr: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    if (dateStr === panelDate && panelIn) { closePanel(); return }
    setPanelDate(dateStr)
    requestAnimationFrame(() => requestAnimationFrame(() => setPanelIn(true)))
  }

  const closePanel = () => {
    setPanelIn(false)
    closeTimer.current = setTimeout(() => setPanelDate(null), 310)
  }

  const getMeetingsForDate = (dateStr: string) =>
    meetings.filter((m) => {
      const s = m.start_time ? toISO(new Date(m.start_time)) : m.date
      const e = m.end_time ? toISO(new Date(m.end_time)) : s
      return dateStr >= s && dateStr <= e
    })

  const openCreate = (dateStr?: string) => {
    setEditMeeting(null)
    setFormDate(dateStr ?? todayStr)
    setFormOpen(true)
  }

  const handleFormSubmit = async (data: MeetingFormData) => {
    if (!user || !data.name.trim() || !data.startDate) return
    setSubmitting(true)

    const startISO = new Date(`${data.startDate}T${data.startTime || '00:00'}:00`).toISOString()
    const endISO =
      data.hasEnd && data.endDate
        ? new Date(`${data.endDate}T${data.endTime || '00:00'}:00`).toISOString()
        : null
    const deadline = applyDeadline(startISO, data.deadlineOffset)

    if (editMeeting) {
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
          deadline: data.deadlineOffset !== '' ? deadline : null,
        })
        .eq('id', editMeeting.id)
    } else {
      const { data: newM, error: err } = await supabase
        .from('meetings')
        .insert({
          name: data.name.trim(),
          date: data.startDate,
          start_time: startISO,
          end_time: endISO,
          description: data.desc.trim() || null,
          created_by: user.id,
          host_id: data.joinSelf ? user.id : null,
          min_members: data.minMembers ? parseInt(data.minMembers) : null,
          max_members: data.maxMembers ? parseInt(data.maxMembers) : null,
          deadline,
        })
        .select('id')
        .maybeSingle()

      if (err) { setError(err.message); setSubmitting(false); return }
      if (newM && data.joinSelf) {
        await supabase.from('meeting_members').insert({ meeting_id: newM.id, user_id: user.id })
      }
    }

    setSubmitting(false)
    setFormOpen(false)
    setEditMeeting(null)
    load()
  }

  const joinMeeting = async (meetingId: string) => {
    if (!user) return
    const { error: err } = await supabase
      .from('meeting_members')
      .insert({ meeting_id: meetingId, user_id: user.id })
    if (!err) {
      const mtg = meetings.find((x) => x.id === meetingId)
      if (mtg && !mtg.host_id) {
        await supabase.from('meetings').update({ host_id: user.id }).eq('id', meetingId)
      }
      load()
    }
  }

  const leaveMeeting = async (meetingId: string) => {
    if (!user) return
    await supabase
      .from('meeting_members')
      .delete()
      .eq('meeting_id', meetingId)
      .eq('user_id', user.id)
    load()
  }

  const deleteMeeting = async (meetingId: string) => {
    if (!confirm('일정을 삭제할까요?')) return
    await supabase.from('meetings').delete().eq('id', meetingId)
    closePanel()
    load()
  }

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  const panelMeetings = panelDate ? getMeetingsForDate(panelDate) : []

  return (
    <Page>
      <PageHeader
        title="일정"
        actions={
          <Button onClick={() => openCreate()}>
            <Plus size={15} />
            일정 만들기
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          {/* month navigator */}
          <div className="mb-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="이전 달"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[--color-text-muted] transition-colors hover:bg-[--color-surface] hover:text-[--color-text]"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="w-28 text-center text-sm font-semibold text-[--color-text]">
              {year}년 {month + 1}월
            </span>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="다음 달"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[--color-text-muted] transition-colors hover:bg-[--color-surface] hover:text-[--color-text]"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* day-of-week labels */}
          <div className="mb-1 grid grid-cols-7">
            {DAY_LABELS.map((d, i) => (
              <div
                key={d}
                className={cn(
                  'pb-2 text-center text-[11px] font-medium',
                  i === 0 ? 'text-red-400/50' : i === 6 ? 'text-blue-400/50' : 'text-[--color-text-muted]/50',
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* SVG filter for crayon effect — defined once */}
          <svg
            aria-hidden="true"
            focusable="false"
            style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
          >
            <defs>
              <filter id="crayon-ring">
                <feTurbulence type="turbulence" baseFrequency="0.045" numOctaves="3" seed="9" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <filter id="crayon-line" x="-2%" y="-300%" width="104%" height="700%">
                <feTurbulence type="turbulence" baseFrequency="0.06" numOctaves="3" seed="4" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <filter id="highlighter" x="-5%" y="-30%" width="110%" height="160%">
                <feTurbulence type="fractalNoise" baseFrequency="0.025 0.07" numOctaves="2" seed="11" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
          </svg>

          {/* calendar grid */}
          <div className="grid grid-cols-7">
            {cells.map(({ date, dateStr, isCurrentMonth }) => {
              const { hasSingleDay = false, bars = [] } = dateMap[dateStr] ?? {}
              const isToday = dateStr === todayStr
              const isSelected = dateStr === panelDate
              const dow = date.getDay()
              const bdCount = isCurrentMonth ? (birthdayMap[dateStr.slice(5)]?.length ?? 0) : 0

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => openPanel(dateStr)}
                  className={cn(
                    'flex flex-col items-stretch transition-opacity',
                    !isCurrentMonth && 'opacity-20',
                  )}
                >
                  <div className="flex justify-center py-1.5">
                    <div className="relative h-9 w-9">
                      {/* birthday highlighter — behind date number */}
                      {bdCount > 0 && isCurrentMonth && !isToday && (
                        <svg
                          aria-hidden="true"
                          focusable="false"
                          className="pointer-events-none absolute"
                          style={{ inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
                          viewBox="0 0 36 36"
                        >
                          <rect
                            x="1" y="9" width="34" height="18"
                            fill="rgba(253,224,71,0.30)"
                            filter="url(#highlighter)"
                          />
                        </svg>
                      )}

                      <span
                        className={cn(
                          'relative z-10 flex h-full w-full items-center justify-center rounded-full text-sm font-medium transition-colors',
                          isToday && 'font-semibold text-white',
                          !isToday && isSelected && 'border-2 border-[--color-accent] text-[--color-accent]',
                          !isToday && !isSelected && isCurrentMonth && 'hover:bg-[--color-surface-2]',
                          !isToday && !isSelected && dow === 0 && 'text-red-400',
                          !isToday && !isSelected && dow === 6 && 'text-blue-400',
                          !isToday && !isSelected && dow !== 0 && dow !== 6 && 'text-[--color-text]',
                        )}
                        style={isToday ? { backgroundColor: 'var(--color-accent)' } : undefined}
                      >
                        {date.getDate()}
                      </span>

                      {/* crayon circle — single-day meetings only */}
                      {hasSingleDay && isCurrentMonth && (
                        <svg
                          aria-hidden="true"
                          focusable="false"
                          className="pointer-events-none absolute z-20"
                          style={{ inset: '-6px', width: 'calc(100% + 12px)', height: 'calc(100% + 12px)' }}
                          viewBox="0 0 48 48"
                        >
                          <ellipse
                            cx="24" cy="24" rx="19" ry="18"
                            fill="none"
                            stroke="#e5484d"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            transform="rotate(-7 24 24)"
                            filter="url(#crayon-ring)"
                            opacity="0.85"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* multi-day event bars — crayon red underline */}
                  {isCurrentMonth && bars.length > 0 && (
                    <div className="flex flex-col gap-0.5 pb-1" style={{ overflow: 'visible' }}>
                      {bars.slice(0, 2).map((bar, i) => (
                        <div
                          key={`${bar.meeting.id}-${i}`}
                          title={bar.meeting.name}
                          style={{
                            marginLeft: bar.type === 'start' ? '50%' : 0,
                            marginRight: bar.type === 'end' ? '50%' : 0,
                            height: '8px',
                            overflow: 'visible',
                          }}
                        >
                          <svg
                            aria-hidden="true"
                            style={{ display: 'block', width: '100%', height: '8px', overflow: 'visible' }}
                            viewBox="0 0 100 8"
                            preserveAspectRatio="none"
                          >
                            <rect
                              x="1" y="3" width="98" height="2.5"
                              rx="1.25"
                              fill="#e5484d"
                              filter="url(#crayon-line)"
                              opacity="0.82"
                            />
                          </svg>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}

      {panelDate && (
        <DayPanel
          dateStr={panelDate}
          panelIn={panelIn}
          meetings={panelMeetings}
          memberCounts={memberCounts}
          joinedIds={joinedIds}
          isMobile={isMobile}
          currentUserId={user?.id}
          isAdmin={isAdmin}
          birthdayNames={birthdayMap[panelDate.slice(5)] ?? []}
          onClose={closePanel}
          onAdd={() => {
            closePanel()
            setTimeout(() => openCreate(panelDate), 320)
          }}
          onGo={(id) => {
            closePanel()
            navigate(isMobile ? `/m/meetings/${id}` : `/meetings/${id}`)
          }}
          onJoin={joinMeeting}
          onLeave={leaveMeeting}
          onEdit={(m) => {
            setEditMeeting(m)
            setFormOpen(true)
          }}
          onDelete={deleteMeeting}
        />
      )}

      <MeetingFormModal
        open={formOpen}
        initialDate={formDate}
        meeting={editMeeting ?? undefined}
        onClose={() => { setFormOpen(false); setEditMeeting(null) }}
        onSubmit={handleFormSubmit}
        submitting={submitting}
      />
    </Page>
  )
}
