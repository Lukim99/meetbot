import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, Bot, SearchX } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'
import { useAuth } from '../hooks/useAuth'
import { MBTI_TYPES, PERM_OWNER, PERM_ADMIN, PERM_BOT, type UserLogs } from '../types'
import { Page, PageHeader } from '../components/ui/Page'
import { Input } from '../components/ui/Input'
import { Avatar } from '../components/ui/Avatar'
import { Loading, ErrorState, EmptyState } from '../components/ui/States'
import { hasLeft } from '../lib/userStatus'
import { cn } from '../lib/cn'

interface MemberRow {
  id: string
  name: string
  kakao_name: string
  title: string
  titles: string[]
  mbti: string | null
  permission: number[]
  profile_image: string | null
  level: number
  logs: UserLogs
}

export default function Members() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { user: me, isOwner } = useAuth()
  const [rows, setRows] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [mbtiFilter, setMbtiFilter] = useState<string>('ALL')
  const [toggling, setToggling] = useState<string | null>(null)

  const load = () => {
    supabase
      .from('users')
      .select('id, name, kakao_name, title, titles, mbti, permission, profile_image, level, logs')
      .order('name')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setRows((data ?? []) as MemberRow[])
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matched = rows.filter((r) => {
      if (hasLeft(r.logs)) return false
      if (mbtiFilter !== 'ALL' && r.mbti !== mbtiFilter) return false
      if (!q) return true
      return [r.name, r.kakao_name ?? ''].join(' ').toLowerCase().includes(q)
    })
    // 권한 우선순위: 소유자(1) → 관리자(2) → 일반 → 봇(3)
    const rank = (perm: number[]) => {
      if (perm.includes(PERM_OWNER)) return 0
      if (perm.includes(PERM_ADMIN)) return 1
      if (perm.includes(PERM_BOT)) return 3
      return 2
    }
    return [...matched].sort((a, b) => rank(a.permission) - rank(b.permission))
  }, [rows, query, mbtiFilter])

  const go = (id: string) => navigate(isMobile ? `/m/members/${id}` : `/members/${id}`)

  const toggleAdmin = async (e: MouseEvent, target: MemberRow) => {
    e.stopPropagation()
    if (toggling) return
    setToggling(target.id)
    const hasAdmin = target.permission.includes(PERM_ADMIN)
    const newPerm = hasAdmin
      ? target.permission.filter((p) => p !== PERM_ADMIN)
      : [...target.permission, PERM_ADMIN]
    const { error } = await supabase
      .from('users')
      .update({ permission: newPerm })
      .eq('id', target.id)
    if (!error) setRows((prev) => prev.map((r) => r.id === target.id ? { ...r, permission: newPerm } : r))
    setToggling(null)
  }

  return (
    <Page>
      <PageHeader title="멤버" />

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="카카오톡 닉네임 또는 핸들 검색"
        className="mb-3"
      />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {['ALL', ...MBTI_TYPES].map((t) => (
          <button
            key={t}
            onClick={() => setMbtiFilter(t)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-xs transition-colors',
              mbtiFilter === t
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={SearchX} message="조건에 맞는 멤버가 없습니다" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((r) => {
            const isTargetOwner = r.permission.includes(PERM_OWNER)
            const isTargetAdmin = r.permission.includes(PERM_ADMIN)
            const isTargetBot = r.permission.includes(PERM_BOT)
            const showToggle = isOwner && r.id !== me?.id && !isTargetOwner && !isTargetBot

            return (
              <button
                key={r.id}
                onClick={() => go(r.id)}
                className="flex items-center gap-3 rounded-xl bg-[var(--color-surface)] p-4 text-left transition-colors hover:bg-[var(--color-surface-2)]"
              >
                {/* 프로필 이미지 + 권한 뱃지 */}
                <div className="relative shrink-0">
                  {r.profile_image ? (
                    <img
                      src={r.profile_image}
                      alt={r.name}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <Avatar name={r.name} size={44} />
                  )}
                  {isTargetOwner && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 ring-2 ring-[var(--color-surface)]">
                      <Crown size={8} className="text-white" />
                    </span>
                  )}
                  {!isTargetOwner && isTargetAdmin && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 ring-2 ring-[var(--color-surface)]">
                      <Crown size={8} className="text-white" />
                    </span>
                  )}
                  {!isTargetOwner && !isTargetAdmin && isTargetBot && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 ring-2 ring-[var(--color-surface)]">
                      <Bot size={8} className="text-white" />
                    </span>
                  )}
                </div>

                {/* 텍스트 정보 */}
                <div className="min-w-0 flex-1">
                  {r.title ? (
                    <div className="truncate text-[10px] font-medium text-[var(--color-accent)]">
                      {r.title}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1.5">
                    <span className="shrink-0 text-[10px] font-semibold text-[var(--color-text-muted)]">
                      Lv.{r.level ?? 1}
                    </span>
                    <span className="truncate font-medium text-[var(--color-text)]">
                      {r.kakao_name || r.name}
                    </span>
                  </div>
                  <div className="truncate text-xs text-[var(--color-text-muted)]">@{r.name}</div>
                </div>

                {/* 관리자 임명/해임 버튼 (소유자 전용) */}
                {showToggle && (
                  <button
                    type="button"
                    onClick={(e) => toggleAdmin(e, r)}
                    disabled={toggling === r.id}
                    aria-label={isTargetAdmin ? '관리자 해임' : '관리자 임명'}
                    className={cn(
                      'shrink-0 rounded-lg p-1.5 transition-colors disabled:opacity-50',
                      isTargetAdmin
                        ? 'text-pink-400 hover:bg-pink-500/10'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]',
                    )}
                  >
                    <Crown size={15} />
                  </button>
                )}
              </button>
            )
          })}
        </div>
      )}
    </Page>
  )
}
