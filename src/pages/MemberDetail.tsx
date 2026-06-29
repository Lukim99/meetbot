import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, LogIn, LogOut, UserX, X, Plus, Crown, AlertTriangle, Trash2, Pencil, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useUser } from '../hooks/useUser'
import { useIsMobile } from '../hooks/useIsMobile'
import { useAuth } from '../hooks/useAuth'
import { MBTI_TYPES, PROFILE_TEXT_FIELDS, PROFILE_FIELD_MAX, type ProfileTextFieldKey, type TitleItem, type UserWarning } from '../types'
import { Page } from '../components/ui/Page'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Tabs } from '../components/ui/Tabs'
import { Loading, ErrorState } from '../components/ui/States'
import { formatBirthday, formatDateTime } from '../lib/format'
import { cn } from '../lib/cn'

const TABS = ['입장/퇴장', '닉변 이력', '통계']

export default function MemberDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { user: me, isAdmin } = useAuth()
  const { user, loading, error, refetch } = useUser(id)
  const [tab, setTab] = useState(0)
  const [kickerNames, setKickerNames] = useState<Record<string, string>>({})

  // 칭호 관리 (관리자)
  const [allTitles, setAllTitles] = useState<TitleItem[]>([])
  const [titleSaving, setTitleSaving] = useState(false)

  // 프로필 정보 수정 (관리자)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBdYear, setEditBdYear] = useState('')
  const [editBdMonth, setEditBdMonth] = useState('')
  const [editBdDay, setEditBdDay] = useState('')
  const [editMbti, setEditMbti] = useState('')
  const [editFields, setEditFields] = useState<Record<ProfileTextFieldKey, string>>(
    () => Object.fromEntries(PROFILE_TEXT_FIELDS.map((f) => [f.key, ''])) as Record<ProfileTextFieldKey, string>,
  )
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // 경고 시스템
  const [warnings, setWarnings] = useState<UserWarning[]>([])
  const [warnerNames, setWarnerNames] = useState<Record<string, string>>({})
  const [warnReason, setWarnReason] = useState('')
  const [warnSaving, setWarnSaving] = useState(false)

  const loadWarnings = useCallback(() => {
    if (!id) return
    supabase
      .from('user_warnings')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setWarnings((data ?? []) as UserWarning[]))
  }, [id])

  useEffect(() => { loadWarnings() }, [loadWarnings])

  useEffect(() => {
    const ids = [...new Set(warnings.map((w) => w.warned_by).filter(Boolean) as string[])]
    if (ids.length === 0) return
    supabase
      .from('users')
      .select('id, name, kakao_name')
      .in('id', ids)
      .then(({ data }) => {
        const map: Record<string, string> = {}
        for (const u of data ?? []) map[u.id] = u.kakao_name || u.name
        setWarnerNames(map)
      })
  }, [warnings])

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

  const addTitle = async (title: string) => {
    if (!title || user.titles.includes(title)) return
    setTitleSaving(true)
    const newTitles = [...user.titles, title]
    const { error } = await supabase
      .from('users')
      .update({ titles: newTitles })
      .eq('id', user.id)
    if (!error) refetch?.()
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

  const addWarning = async () => {
    const reason = warnReason.trim()
    if (!reason || !me) return
    setWarnSaving(true)
    const { error } = await supabase
      .from('user_warnings')
      .insert({ user_id: user.id, reason, warned_by: me.id })
    if (!error) {
      setWarnReason('')
      loadWarnings()
    }
    setWarnSaving(false)
  }

  const removeWarning = async (warningId: string) => {
    setWarnSaving(true)
    const { error } = await supabase.from('user_warnings').delete().eq('id', warningId)
    if (!error) loadWarnings()
    setWarnSaving(false)
  }

  const startEditProfile = () => {
    setEditName(user.name ?? '')
    const bd = user.birthday ?? ''
    if (bd.length === 10 && bd[4] === '.') {
      const parts = bd.split('.')
      setEditBdYear(parts[0])
      setEditBdMonth(String(parseInt(parts[1])))
      setEditBdDay(String(parseInt(parts[2])))
    } else if (bd.length === 6) {
      setEditBdYear('')
      setEditBdMonth(String(parseInt(bd.slice(2, 4))))
      setEditBdDay(String(parseInt(bd.slice(4, 6))))
    } else {
      setEditBdYear(''); setEditBdMonth(''); setEditBdDay('')
    }
    setEditMbti(user.mbti ?? '')
    setEditFields(
      Object.fromEntries(
        PROFILE_TEXT_FIELDS.map((f) => [f.key, (user[f.key] as string | null) ?? '']),
      ) as Record<ProfileTextFieldKey, string>,
    )
    setProfileError(null)
    setEditingProfile(true)
  }

  const saveProfile = async () => {
    const name = editName.trim()
    if (!name) { setProfileError('핸들을 입력해 주세요'); return }
    setProfileSaving(true)
    setProfileError(null)

    if (name !== user.name) {
      const { data: dup, error: dupErr } = await supabase
        .from('users')
        .select('id')
        .eq('name', name)
        .neq('id', user.id)
        .maybeSingle()
      if (dupErr) { setProfileSaving(false); setProfileError(dupErr.message); return }
      if (dup) { setProfileSaving(false); setProfileError('이미 사용 중인 핸들입니다'); return }
    }

    const birthday = editBdYear && editBdMonth && editBdDay
      ? `${editBdYear.padStart(4, '0')}.${editBdMonth.padStart(2, '0')}.${editBdDay.padStart(2, '0')}`
      : ''
    const textUpdates = Object.fromEntries(
      PROFILE_TEXT_FIELDS.map((f) => [f.key, editFields[f.key].trim() || null]),
    )
    const { error } = await supabase
      .from('users')
      .update({ name, birthday, mbti: editMbti || null, ...textUpdates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    setProfileSaving(false)
    if (error) { setProfileError(error.message); return }
    setEditingProfile(false)
    refetch?.()
  }

  return (
    <Page>
      <button
        onClick={() => navigate(isMobile ? '/m/members' : '/members')}
        className="mb-4 flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
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
            <h1 className="truncate text-xl font-semibold text-[var(--color-text)]">
              {user.kakao_name || user.name}
            </h1>
            {user.title && <Badge tone="accent">{user.title}</Badge>}
            {user.mbti && <Badge tone="neutral">{user.mbti}</Badge>}
            {isAdmin && warnings.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/25 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
                <AlertTriangle size={11} />
                경고 {warnings.length}회
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">@{user.name}</div>
          <div className="mt-1 text-sm text-[var(--color-text-muted)]">
            생일 {formatBirthday(user.birthday)} · 채팅 {user.chat_count.toLocaleString('ko-KR')}
          </div>
        </div>
      </Card>

      {/* 프로필 정보 */}
      {(isAdmin || PROFILE_TEXT_FIELDS.some((f) => user[f.key]) || user.mbti) && (
        <Card className="mb-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="text-sm font-medium text-[var(--color-text)]">프로필 정보</div>
            {isAdmin && !editingProfile && (
              <button
                type="button"
                onClick={startEditProfile}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
              >
                <Pencil size={12} />
                수정
              </button>
            )}
          </div>

          {editingProfile ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1.5 text-xs text-[var(--color-text-muted)]">핸들</div>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-[var(--color-text-muted)]">@</span>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value.replace(/[^ㄱ-ㅣㆍ가-힣a-zA-Z0-9_.]/g, ''))}
                      placeholder="핸들"
                      className="pl-7"
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 text-xs text-[var(--color-text-muted)]">생일</div>
                  <div className="flex gap-2">
                    <Input
                      value={editBdYear}
                      onChange={(e) => setEditBdYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="연도"
                      inputMode="numeric"
                      className="flex-[5]"
                    />
                    <Input
                      value={editBdMonth}
                      onChange={(e) => setEditBdMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      placeholder="월"
                      inputMode="numeric"
                      className="flex-[3]"
                    />
                    <Input
                      value={editBdDay}
                      onChange={(e) => setEditBdDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      placeholder="일"
                      inputMode="numeric"
                      className="flex-[3]"
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 text-xs text-[var(--color-text-muted)]">MBTI</div>
                  <select
                    value={editMbti}
                    onChange={(e) => setEditMbti(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/[.12]"
                  >
                    <option value="">없음</option>
                    {MBTI_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                {PROFILE_TEXT_FIELDS.map((f) => (
                  <div key={f.key}>
                    <div className="mb-1.5 text-xs text-[var(--color-text-muted)]">{f.label}</div>
                    <Input
                      value={editFields[f.key]}
                      onChange={(e) =>
                        setEditFields((prev) => ({ ...prev, [f.key]: e.target.value.slice(0, PROFILE_FIELD_MAX) }))
                      }
                      placeholder={f.placeholder}
                      maxLength={PROFILE_FIELD_MAX}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button onClick={saveProfile} loading={profileSaving}>
                  <Check size={14} />
                  저장
                </Button>
                <Button variant="ghost" onClick={() => setEditingProfile(false)} disabled={profileSaving}>
                  취소
                </Button>
                {profileError && <span className="text-sm text-red-400">{profileError}</span>}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {user.mbti && (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="shrink-0 text-[var(--color-text-muted)]">MBTI</span>
                  <span className="truncate text-[var(--color-text)]">{user.mbti}</span>
                </div>
              )}
              {PROFILE_TEXT_FIELDS.map((f) => {
                const value = user[f.key] as string | null
                if (!value && !isAdmin) return null
                return (
                  <div key={f.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="shrink-0 text-[var(--color-text-muted)]">{f.label}</span>
                    <span className={cn('truncate', value ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]')}>
                      {value || '미설정'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {/* 관리자 칭호 배정 */}
      {isAdmin && (
        <Card className="mb-5">
          <div className="mb-3 text-sm font-medium text-[var(--color-text)]">칭호 관리</div>

          {/* 보유 칭호 */}
          <div className="mb-1.5 text-xs text-[var(--color-text-muted)]">보유 칭호</div>
          <div className="mb-4 flex flex-wrap gap-2">
            {user.titles.length === 0 && (
              <span className="text-xs text-[var(--color-text-muted)]">배정된 칭호 없음</span>
            )}
            {user.titles.map((t) => {
              const isActive = t === user.title
              return (
                <span
                  key={t}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                    isActive
                      ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => !isActive && setActiveTitle(t)}
                    disabled={isActive || titleSaving}
                    title={isActive ? '대표 칭호' : '대표 칭호로 설정'}
                    className="flex items-center gap-1 disabled:cursor-default"
                    aria-label={isActive ? '대표 칭호' : `${t}을(를) 대표 칭호로 설정`}
                  >
                    <Crown
                      size={10}
                      className={isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] opacity-30'}
                    />
                    {t}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTitle(t)}
                    disabled={titleSaving}
                    aria-label={`${t} 제거`}
                    className="ml-0.5 rounded-full p-0.5 text-[var(--color-text-muted)] transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:opacity-40"
                  >
                    <X size={10} />
                  </button>
                </span>
              )
            })}
          </div>

          {/* 추가 가능한 칭호 */}
          {availableToAdd.length > 0 && (
            <>
              <div className="mb-2 text-xs text-[var(--color-text-muted)]">추가 가능한 칭호</div>
              <div className="flex flex-wrap gap-2">
                {availableToAdd.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => addTitle(t.name)}
                    disabled={titleSaving}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)] disabled:opacity-40"
                  >
                    <Plus size={10} />
                    {t.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* 경고 관리 (permission 1 또는 2) */}
      {isAdmin && (
        <Card className="mb-5">
          <div className="mb-3 flex items-center gap-1.5 text-sm font-medium text-[var(--color-text)]">
            <AlertTriangle size={15} className="text-red-400" />
            경고 관리
            {warnings.length > 0 && (
              <span className="text-[var(--color-text-muted)]">· 누적 {warnings.length}회</span>
            )}
          </div>

          {/* 경고 부여 */}
          <div className="mb-4 flex gap-2">
            <Input
              value={warnReason}
              onChange={(e) => setWarnReason(e.target.value)}
              placeholder="경고 사유 입력"
              onKeyDown={(e) => { if (e.key === 'Enter') addWarning() }}
            />
            <Button
              variant="danger"
              onClick={addWarning}
              loading={warnSaving}
              disabled={!warnReason.trim()}
              className="shrink-0"
            >
              경고 부여
            </Button>
          </div>

          {/* 경고 내역 */}
          {warnings.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">경고 내역이 없습니다</p>
          ) : (
            <div className="flex flex-col gap-2">
              {warnings.map((w) => (
                <div
                  key={w.id}
                  className="flex items-start gap-3 rounded-lg border-l-2 border-l-red-500 bg-[var(--color-surface)] px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-[var(--color-text)]">{w.reason}</div>
                    <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      {w.warned_by ? `${warnerNames[w.warned_by] ?? w.warned_by} · ` : ''}
                      {formatDateTime(w.created_at)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeWarning(w.id)}
                    disabled={warnSaving}
                    aria-label="경고 삭제"
                    className="shrink-0 rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="mt-5">
        {tab === 0 && (
          <div className="flex flex-col gap-2">
            {events.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">기록이 없습니다</p>
            )}
            {events.map((ev, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 rounded-lg border-l-2 bg-[var(--color-surface)] px-4 py-3',
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
                  <div className="text-sm text-[var(--color-text)]">
                    {ev.kind === 'entry'
                      ? '입장'
                      : ev.cause === '강퇴'
                        ? `강퇴${ev.kicked_by ? ` (by ${kickerNames[ev.kicked_by] ?? ev.kicked_by})` : ''}`
                        : '나가기'}
                  </div>
                  <div className="truncate text-xs text-[var(--color-text-muted)]">{ev.name}</div>
                </div>
                <div className="shrink-0 text-xs text-[var(--color-text-muted)]">{formatDateTime(ev.date)}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 1 && (
          <div className="flex flex-col gap-2">
            {changes.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">닉네임 변경 기록이 없습니다</p>
            )}
            {changes.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg bg-[var(--color-surface)] px-4 py-3"
              >
                <div className="min-w-0 text-sm">
                  <span className="text-[var(--color-text-muted)] line-through">{c.old_name}</span>
                  <span className="mx-2 text-[var(--color-text-muted)]">→</span>
                  <span className="text-[var(--color-text)]">{c.new_name}</span>
                </div>
                <div className="shrink-0 text-xs text-[var(--color-text-muted)]">{formatDateTime(c.date)}</div>
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
      <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{value.toLocaleString('ko-KR')}</div>
    </Card>
  )
}
