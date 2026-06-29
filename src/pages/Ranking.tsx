import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, Inbox } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'
import { PERM_OWNER, PERM_ADMIN, PERM_BOT, type UserLogs } from '../types'
import { Page, PageHeader } from '../components/ui/Page'
import { Avatar } from '../components/ui/Avatar'
import { RankBadge } from '../components/ui/RankBadge'
import { Loading, ErrorState, EmptyState } from '../components/ui/States'
import { hasLeft } from '../lib/userStatus'
import { cn } from '../lib/cn'

interface RankRow {
  id: string
  name: string
  kakao_name: string
  title: string
  chat_count: number
  permission: number[]
  profile_image: string | null
  level: number
  logs: UserLogs
}

export default function Ranking() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [rows, setRows] = useState<RankRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('users')
      .select('id, name, kakao_name, title, chat_count, permission, profile_image, level, logs')
      .order('chat_count', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setRows(((data ?? []) as RankRow[]).filter((r) => !r.permission?.includes(PERM_BOT) && !hasLeft(r.logs)))
        setLoading(false)
      })
  }, [])

  const go = (id: string) => navigate(isMobile ? `/m/members/${id}` : `/members/${id}`)

  return (
    <Page>
      <PageHeader title="채팅 랭킹" />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Inbox} message="아직 데이터가 없습니다" />
      ) : isMobile ? (
        /* 모바일: 멤버 탭과 동일한 카드 레이아웃 */
        <div className="flex flex-col gap-3">
          {rows.map((r, i) => (
            <button
              key={r.id}
              onClick={() => go(r.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl bg-[var(--color-surface)] p-4 text-left transition-colors hover:bg-[var(--color-surface-2)]',
                i === 0 && 'bg-[var(--color-accent)]/5',
              )}
            >
              <RankBadge rank={i + 1} />
              <ProfileAvatar row={r} />
              <ProfileText row={r} />
              <div className="shrink-0 text-sm font-medium text-[var(--color-accent)]">
                {r.chat_count.toLocaleString('ko-KR')}
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* PC: 테이블 레이아웃 */
        <div className="overflow-hidden rounded-xl bg-[var(--color-surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
                <th className="w-20 px-5 py-3.5 text-center font-medium">순위</th>
                <th className="px-5 py-3.5 text-left font-medium">멤버</th>
                <th className="w-32 px-5 py-3.5 text-right font-medium">채팅 수</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  onClick={() => go(r.id)}
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-[var(--color-surface-2)]',
                    i < rows.length - 1 && 'border-b border-[var(--color-border)]',
                    i === 0 && 'bg-[var(--color-accent)]/5',
                  )}
                >
                  <td className="px-5 py-3">
                    <div className="flex justify-center">
                      <RankBadge rank={i + 1} />
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <ProfileAvatar row={r} />
                      <ProfileText row={r} />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-[var(--color-accent)]">
                    {r.chat_count.toLocaleString('ko-KR')}
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

function ProfileAvatar({ row }: { row: RankRow }) {
  const isOwner = row.permission.includes(PERM_OWNER)
  const isAdmin = row.permission.includes(PERM_ADMIN)
  return (
    <div className="relative shrink-0">
      {row.profile_image ? (
        <img src={row.profile_image} alt={row.name} className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <Avatar name={row.name} size={40} />
      )}
      {isOwner && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 ring-2 ring-[var(--color-surface)]">
          <Crown size={8} className="text-white" />
        </span>
      )}
      {!isOwner && isAdmin && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 ring-2 ring-[var(--color-surface)]">
          <Crown size={8} className="text-white" />
        </span>
      )}
    </div>
  )
}

function ProfileText({ row }: { row: RankRow }) {
  return (
    <div className="min-w-0 flex-1">
      {row.title && (
        <div className="truncate text-[10px] font-medium text-[var(--color-accent)]">{row.title}</div>
      )}
      <div className="flex items-center gap-1.5">
        <span className="shrink-0 text-[10px] font-semibold text-[var(--color-text-muted)]">
          Lv.{row.level ?? 1}
        </span>
        <span className="truncate font-medium text-[var(--color-text)]">
          {row.kakao_name || row.name}
        </span>
      </div>
      <div className="truncate text-xs text-[var(--color-text-muted)]">@{row.name}</div>
    </div>
  )
}
