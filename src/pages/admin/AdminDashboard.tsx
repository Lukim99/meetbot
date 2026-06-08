import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Terminal, Receipt, Award, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useIsMobile } from '../../hooks/useIsMobile'
import { Page, PageHeader } from '../../components/ui/Page'
import { Card } from '../../components/ui/Card'
import { Loading } from '../../components/ui/States'

interface Stats {
  users: number
  todayEntry: number
  totalChat: number
  meetings: number
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const run = async () => {
      const [users, meetings, chat] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('meetings').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('chat_count, logs'),
      ])
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
      let totalChat = 0
      let todayEntry = 0
      for (const u of (chat.data ?? []) as { chat_count: number; logs: any }[]) {
        totalChat += u.chat_count ?? 0
        for (const e of u.logs?.entry ?? []) {
          const d = new Date(e.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
          if (d === today) todayEntry++
        }
      }
      setStats({
        users: users.count ?? 0,
        meetings: meetings.count ?? 0,
        totalChat,
        todayEntry,
      })
    }
    run()
  }, [])

  const link = (path: string) => navigate(isMobile ? `/m${path}` : path)

  return (
    <Page>
      <PageHeader title="관리자 대시보드" />
      {!stats ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard label="총 유저 수" value={stats.users} />
            <StatCard label="오늘 입장" value={stats.todayEntry} />
            <StatCard label="총 채팅 수" value={stats.totalChat} />
            <StatCard label="전체 모임 수" value={stats.meetings} />
          </div>

          <h2 className="mb-3 mt-8 text-base font-medium text-[--color-text]">관리 기능</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NavCard
              icon={MessageSquare}
              title="입장 메시지 설정"
              desc="신규 입장 시 자동 전송 메시지"
              onClick={() => link('/admin/welcome')}
            />
            <NavCard
              icon={Terminal}
              title="명령어 관리"
              desc="자동응답 명령어 추가/수정"
              onClick={() => link('/admin/commands')}
            />
            <NavCard
              icon={Receipt}
              title="모임 정산"
              desc="모임별 정산 현황 관리"
              onClick={() => link('/admin/settlements')}
            />
            <NavCard
              icon={Award}
              title="칭호 관리"
              desc="칭호 목록 추가 및 삭제"
              onClick={() => link('/admin/titles')}
            />
          </div>
        </>
      )}
    </Page>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <div className="text-xs text-[--color-text-muted]">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-[--color-text]">
        {value.toLocaleString('ko-KR')}
      </div>
    </Card>
  )
}

function NavCard({
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  icon: LucideIcon
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="text-left">
      <Card className="flex items-center gap-3 transition-colors hover:bg-[--color-surface-2]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[--color-accent]/10 text-[--color-accent]">
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-[--color-text]">{title}</div>
          <div className="truncate text-xs text-[--color-text-muted]">{desc}</div>
        </div>
        <ChevronRight size={18} className="shrink-0 text-[--color-text-muted]" />
      </Card>
    </button>
  )
}
