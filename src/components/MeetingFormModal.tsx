import { useEffect, useState } from 'react'
import { CalendarDays, Check, X } from 'lucide-react'
import type { Meeting } from '../types'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { cn } from '../lib/cn'

export interface MeetingFormData {
  name: string
  desc: string
  startDate: string
  startTime: string
  hasEnd: boolean
  endDate: string
  endTime: string
  minMembers: string
  maxMembers: string
  deadlineOffset: string
  joinSelf: boolean
}

interface Props {
  open: boolean
  initialDate?: string
  meeting?: Meeting
  onClose: () => void
  onSubmit: (data: MeetingFormData) => Promise<void>
  submitting: boolean
}

const DEADLINE_OPTS = [
  { value: '', label: '없음' },
  { value: '30m', label: '시작 30분 전' },
  { value: '1h', label: '시작 1시간 전' },
  { value: '3h', label: '시작 3시간 전' },
  { value: '12h', label: '시작 12시간 전' },
  { value: '1d', label: '시작 1일 전' },
]

function guessOffset(startISO: string | null, deadline: string | null): string {
  if (!startISO || !deadline) return ''
  const diff = new Date(startISO).getTime() - new Date(deadline).getTime()
  if (Math.abs(diff - 30 * 60000) < 60000) return '30m'
  if (Math.abs(diff - 3600000) < 60000) return '1h'
  if (Math.abs(diff - 10800000) < 60000) return '3h'
  if (Math.abs(diff - 43200000) < 60000) return '12h'
  if (Math.abs(diff - 86400000) < 60000) return '1d'
  return ''
}

function toDateStr(iso: string | null | undefined, fallback = ''): string {
  if (!iso) return fallback
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toTimeStr(iso: string | null | undefined): string {
  if (!iso) return '12:00'
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const fieldCls =
  'rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none transition-colors'

// 날짜/시간 네이티브 입력: 한국어 로케일의 "오후 12:00" + 아이콘이 잘리지 않도록 패딩을 줄이고 폭을 유연하게
const dateTimeFieldCls =
  'min-w-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2.5 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none transition-colors'

export function MeetingFormModal({ open, initialDate, meeting, onClose, onSubmit, submitting }: Props) {
  const isEdit = !!meeting

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('12:00')
  const [hasEnd, setHasEnd] = useState(false)
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('14:00')
  const [minMembers, setMinMembers] = useState('')
  const [maxMembers, setMaxMembers] = useState('')
  const [deadlineOffset, setDeadlineOffset] = useState('')
  const [joinSelf, setJoinSelf] = useState(true)

  useEffect(() => {
    if (!open) return
    if (meeting) {
      setName(meeting.name)
      setDesc(meeting.description ?? '')
      setStartDate(toDateStr(meeting.start_time, meeting.date))
      setStartTime(toTimeStr(meeting.start_time))
      setHasEnd(!!meeting.end_time)
      setEndDate(toDateStr(meeting.end_time, meeting.date))
      setEndTime(toTimeStr(meeting.end_time))
      setMinMembers(meeting.min_members?.toString() ?? '')
      setMaxMembers(meeting.max_members?.toString() ?? '')
      setDeadlineOffset(guessOffset(meeting.start_time, meeting.deadline))
    } else {
      setName('')
      setDesc('')
      setStartDate(initialDate ?? '')
      setStartTime('12:00')
      setHasEnd(false)
      setEndDate(initialDate ?? '')
      setEndTime('14:00')
      setMinMembers('')
      setMaxMembers('')
      setDeadlineOffset('')
      setJoinSelf(true)
    }
  }, [open, meeting, initialDate])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({ name, desc, startDate, startTime, hasEnd, endDate, endTime, minMembers, maxMembers, deadlineOffset, joinSelf })
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="mx-auto w-full max-w-md overflow-hidden rounded-t-2xl bg-[var(--color-surface)] shadow-2xl sm:rounded-2xl"
        style={{ border: '1px solid var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-[3px] bg-gradient-to-r from-[#818cf8] to-[#6366f1]" />

        <div className="flex items-center justify-between px-6 pb-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)]/15">
              <CalendarDays size={15} className="text-[var(--color-accent)]" />
            </div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">{isEdit ? '일정 수정' : '새 일정'}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)]"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto px-6 pb-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
              일정 이름 <span className="text-red-400">*</span>
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="어떤 일정인가요?" autoFocus required />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
              시작 <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className={cn(dateTimeFieldCls, 'flex-[3]')}
                style={{ colorScheme: 'dark' }}
              />
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={cn(dateTimeFieldCls, 'flex-[2]')}
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--color-text-muted)]">종료</label>
              <button
                type="button"
                onClick={() => setHasEnd((h) => !h)}
                className={cn(
                  'text-xs transition-colors',
                  hasEnd ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                )}
              >
                {hasEnd ? '설정됨 ×' : '+ 종료 시간 설정'}
              </button>
            </div>
            {hasEnd && (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={cn(dateTimeFieldCls, 'flex-[3]')}
                  style={{ colorScheme: 'dark' }}
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={cn(dateTimeFieldCls, 'flex-[2]')}
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
              설명 <span className="font-normal text-[var(--color-text-muted)]">선택</span>
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              placeholder="장소나 메모를 남겨보세요"
              className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">최소 인원</label>
              <Input
                type="number"
                min="1"
                value={minMembers}
                onChange={(e) => setMinMembers(e.target.value)}
                placeholder="없음"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">최대 인원</label>
              <Input
                type="number"
                min="1"
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                placeholder="없음"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">참가 마감</label>
            <select
              value={deadlineOffset}
              onChange={(e) => setDeadlineOffset(e.target.value)}
              className={cn(fieldCls, 'w-full')}
            >
              {DEADLINE_OPTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {!isEdit && (
            <button
              type="button"
              onClick={() => setJoinSelf((j) => !j)}
              className="flex items-center gap-2.5 text-left"
            >
              <div
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                  joinSelf
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/20'
                    : 'border-[var(--color-border-strong)] bg-[var(--color-surface-2)]',
                )}
              >
                {joinSelf && <Check size={10} className="text-[var(--color-accent)]" />}
              </div>
              <span className="text-sm text-[var(--color-text)]">모임장 되기</span>
            </button>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" fullWidth onClick={onClose}>
              취소
            </Button>
            <Button type="submit" fullWidth loading={submitting} disabled={!name.trim() || !startDate}>
              {isEdit ? '저장하기' : '만들기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
