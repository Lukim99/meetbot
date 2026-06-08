import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, CalendarDays } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'
import { useAuthStore } from '../store/authStore'
import type { Meeting } from '../types'
import { Page, PageHeader } from '../components/ui/Page'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Loading, ErrorState, EmptyState } from '../components/ui/States'
import { formatDate } from '../lib/format'

interface MeetingWithCount extends Meeting {
  count: number
}

export default function Meetings() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const user = useAuthStore((s) => s.user)
  const [rows, setRows] = useState<MeetingWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [desc, setDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const load = () => {
    setLoading(true)
    supabase
      .from('meetings')
      .select('*, meeting_members(count)')
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else {
          const mapped = (data ?? []).map((m: any) => ({
            ...m,
            count: m.meeting_members?.[0]?.count ?? 0,
          })) as MeetingWithCount[]
          setRows(mapped)
        }
        setLoading(false)
      })
  }

  useEffect(load, [])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !name.trim() || !date) return
    setCreating(true)
    const { data, error } = await supabase
      .from('meetings')
      .insert({ name: name.trim(), date, description: desc.trim() || null, created_by: user.id })
      .select('id')
      .maybeSingle()
    if (!error && data) {
      await supabase.from('meeting_members').insert({ meeting_id: data.id, user_id: user.id })
    }
    setCreating(false)
    if (error) {
      setError(error.message)
      return
    }
    setOpen(false)
    setName('')
    setDate('')
    setDesc('')
    load()
  }

  const go = (id: string) => navigate(isMobile ? `/m/meetings/${id}` : `/meetings/${id}`)

  return (
    <Page>
      <PageHeader
        title="모임"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} />
            모임 만들기
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : rows.length === 0 ? (
        <EmptyState icon={CalendarDays} message="아직 모임이 없습니다" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((m) => (
            <button key={m.id} onClick={() => go(m.id)} className="text-left">
              <Card className="h-full transition-colors hover:bg-[--color-surface-2]">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="min-w-0 truncate font-medium text-[--color-text]">{m.name}</h3>
                  {m.settled ? (
                    <Badge tone="success">정산완료</Badge>
                  ) : (
                    <Badge tone="warning">미정산</Badge>
                  )}
                </div>
                <div className="text-xs text-[--color-text-muted]">
                  {formatDate(m.date)} · {m.count}명 참여
                </div>
                {m.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-[--color-text-muted]">
                    {m.description}
                  </p>
                )}
              </Card>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title="모임 만들기"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button onClick={create} loading={creating} disabled={!name.trim() || !date}>
              만들기
            </Button>
          </>
        }
      >
        <form onSubmit={create} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs text-[--color-text-muted]">이름</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="모임 이름" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[--color-text-muted]">날짜</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[--color-text-muted]">설명 (선택)</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-[--color-border] bg-[--color-surface-2] px-3 py-2 text-sm text-[--color-text] placeholder:text-[--color-text-muted] focus:border-[--color-accent] focus:outline-none"
              placeholder="모임 설명"
            />
          </div>
        </form>
      </Modal>
    </Page>
  )
}
