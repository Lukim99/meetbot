import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, LogIn, LogOut, UserX, X, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useUser } from '../hooks/useUser'
import { useIsMobile } from '../hooks/useIsMobile'
import { useAuth } from '../hooks/useAuth'
import { type TitleItem } from '../types'
import { Page } from '../components/ui/Page'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Tabs } from '../components/ui/Tabs'
import { Loading, ErrorState } from '../components/ui/States'
import { formatBirthday, formatDateTime } from '../lib/format'
import { cn } from '../lib/cn'

const TABS = ['입장/퇴장', '닉변 이력', '통계']

export default function MemberDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { isAdmin } = useAuth()
  const { user, loading, error, refetch } = useUser(id)
  const [tab, setTab] = useState(0)
  const [kickerNames, setKickerNames] = useState<Record<string, string>>({})

  // 칭호 관리 (관리자)
  const [allTitles, setAllTitles] = useState<TitleItem[]>([])
  const [selectedTitle, setSelectedTitle] = useState('')
  const [titleSaving, setTitleSaving] = useState(false)

  const kickerIds = useMemo(() => {
    if (!user) return []
    return [...new Set(user.logs.exit.map((e) => e.kicked_by).filter(Boolean) as string[])]
  }, [user])

  useEffect(() => {
    if (kickerIds.length === 0) return
    supabase
      .from('users')
      .select('id, name')
      .in('id', kickerIds)
      .then(({ data }) => {
        const map: Record<string, string> = {}
        for (const u of data ?? []) map[u.id] = u.name
        setKickerNames(map)
      })
  }, [kickerIds])

  useEffect(() => {
    if (!isAdmin) return
    supabase.from('titles').select('*').order('name').then(({ data }) => {
      setAllTitles((data ?? []) as TitleItem[])
    })
  }, [isAdmin])

  if (loading) return <Page><Loading /></Page>
  if (error) return <Page><ErrorState message={error} /></Page>
  if (!user) return <Page><ErrorState message="유저를 찾을 수 없습니다" /></Page>

  const events = [
    ...user.logs.entry.map((e) => ({ kind: 'entry' as const, date: e.date, name: e.name })),
    ...user.logs.exit.map((e) => ({ kind: 'exit' as const, ...e })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const changes = [...user.logs.change_name].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  const kickCount = user.logs.exit.filter((e) => e.cause === '강퇴').length

  const addTitle = async () => {
    if (!selectedTitle || user.titles.includes(selectedTitle)) return
    setTitleSaving(true)
    const newTitles = [...user.titles, selectedTitle]
    const { error } = await supabase
      .from('users')
      .update({ titles: newTitles })
      .eq('id', user.id)
    if (!error) { refetch?.(); setSelectedTitle('') }
    setTitleSaving(false)
  }

  const removeTitle = async (t: string) => {
    setTitleSaving(true)
    const newTitles = user.titles.filter((x) => x !== t)
    const newTitle = user.title === t ? (newTitles[0] ?? '') : user.title
    const { error } = await supabase
      .from('users')
      .update({ titles: newTitles, title: newTitle })
      .eq('id', user.id)
    if (!error) refetch?.()
    setTitleSaving(false)
  }

  const setActiveTitle = async (t: string) => {
    const { error } = await supabase
      .from('users')
      .update({ title: t })
      .eq('id', user.id)
    if (!error) refetch?.()
  }

  const availableToAdd = allTitles.filter((t) => !user.titles.includes(t.name))

  return (
    <Page>
      <button
        onClick={() => navigate(isMobile ? '/m/members' : '/members')}
        className="mb-4 flex items-center gap-1.5 text-sm text-[--color-text-muted] hover:text-[--color-text] transition-colors"
      >
        <ArrowLeft size={16} />
        멤버 목록
      </button>

      {/* 프로필 헤더 */}
      <Card className="mb-5 flex items-center gap-4">
        {user.profile_image ? (
          <img src={user.profile_image} alt={user.name} className="h-14 w-14 rounded-full object-cover shrink-0" />
        ) : (
          <Avatar name={user.name} size={56} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold text-[--color-text]">
              {user.kakao_name || user.name}
            </h1>
            {user.title && <Badge tone="accent">{user.title}</Badge>}
            {user.mbti && <Badge tone="neutral">{user.mbti}</Badge>}
          </div>
          <div className="mt-0.5 text-xs text-[--color-text-muted]">@{user.name}</div>
          <div className="mt-1 text-sm text-[--color-text-muted]">
            생일 {formatBirthday(user.birthday)} · 채팅 {user.chat_count.toLocaleString('ko-KR')}
          </div>
        </div>
      </Card>

      {/* 관리자 칭호 배정 */}
      {isAdmin && (
        <Card className="mb-5">
          <div className="mb-3 text-xs font-medium text-[--color-text-muted]">칭호 관리</div>

          {/* 현재 칭호 목록 */}
          <div className="mb-3 flex flex-wrap gap-2">
            {user.titles.length === 0 && (
              <span className="text-xs text-[--color-text-muted]">배정된 칭호 없음</span>
            )}
            {user.titles.map((t) => (
              <span
                key={t}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                  t === user.title
                    ? 'bg-[--color-accent]/15 text-[--color-accent]'
                    : 'bg-[--color-surface-2] text-[--color-text-muted]',
                )}
              >
                <button
                  type="button"
                  onClick={() => setActiveTitle(t)}
                  disabled={t === user.title || titleSaving}
                  className="disabled:opacity-40"
                  aria-label="대표 칭호로 설정"
                >
                  {t}
                </button>
                <button
                  type="button"
                  onClick={() => removeTitle(t)}
                  disabled={titleSaving}
                  aria-label={`${t} 제거`}
                  className="text-[--color-text-muted] hover:text-red-400 disabled:opacity-40"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>

          {/* 칭호 추가 */}
          {availableToAdd.length > 0 && (
            <div className="flex gap-2">
              <select
                value={selectedTitle}
                onChange={(e) => setSelectedTitle(e.target.value)}
                className="flex-1 rounded-lg border border-[--color-border] bg-[--color-surface-2] px-3 py-2 text-sm text-[--color-text] focus:border-[--color-accent] focus:outline-none"
              >
                <option value="">칭호 선택</option>
                {availableToAdd.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={addTitle}
                disabled={!selectedTitle || titleSaving}
                aria-label="칭호 추가"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[--color-accent]/10 text-[--color-accent] transition-colors hover:bg-[--color-accent]/20 disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
          <p className="mt-2 text-[10px] text-[--color-text-muted]">
            칭호 이름을 클릭하면 대표 칭호로 설정됩니다
          </p>
        </Card>
      )}

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="mt-5">
        {tab === 0 && (
          <div className="flex flex-col gap-2">
            {events.length === 0 && (
              <p className="py-8 text-center text-sm text-[--color-text-muted]">기록이 없습니다</p>
            )}
            {events.map((ev, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 rounded-lg border-l-2 bg-[--color-surface] px-4 py-3',
                  ev.kind === 'entry' ? 'border-l-green-500' : 'border-l-red-500',
                )}
              >
                {ev.kind === 'entry' ? (
                  <LogIn size={16} className="shrink-0 text-green-500" />
                ) : ev.cause === '강퇴' ? (
                  <UserX size={16} className="shrink-0 text-red-500" />
                ) : (
                  <LogOut size={16} className="shrink-0 text-red-500" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-[--color-text]">
                    {ev.kind === 'entry'
                      ? '입장'
                      : ev.cause === '강퇴'
                        ? `강퇴${ev.kicked_by ? ` (by ${kickerNames[ev.kicked_by] ?? ev.kicked_by})` : ''}`
                        : '나가기'}
                  </div>
                  <div className="truncate text-xs text-[--color-text-muted]">{ev.name}</div>
                </div>
                <div className="shrink-0 text-xs text-[--color-text-muted]">{formatDateTime(ev.date)}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 1 && (
          <div className="flex flex-col gap-2">
            {changes.length === 0 && (
              <p className="py-8 text-center text-sm text-[--color-text-muted]">닉네임 변경 기록이 없습니다</p>
            )}
            {changes.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg bg-[--color-surface] px-4 py-3"
              >
                <div className="min-w-0 text-sm">
                  <span className="text-[--color-text-muted] line-through">{c.old_name}</span>
                  <span className="mx-2 text-[--color-text-muted]">→</span>
                  <span className="text-[--color-text]">{c.new_name}</span>
                </div>
                <div className="shrink-0 text-xs text-[--color-text-muted]">{formatDateTime(c.date)}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 2 && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="총 채팅 수" value={user.chat_count} />
            <Stat label="입장 횟수" value={user.logs.entry.length} />
            <Stat label="퇴장 횟수" value={user.logs.exit.length} />
            <Stat label="강퇴 횟수" value={kickCount} />
          </div>
        )}
      </div>
    </Page>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <div className="text-xs text-[--color-text-muted]">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-[--color-text]">{value.toLocaleString('ko-KR')}</div>
    </Card>
  )
}
