import { useEffect, useState } from 'react'
import { Check, Settings, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { MBTI_TYPES, PROFILE_TEXT_FIELDS, PROFILE_FIELD_MAX, type ProfileTextFieldKey, type User } from '../types'
import { Page, PageHeader } from '../components/ui/Page'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { Loading } from '../components/ui/States'
import { formatDate, formatBirthday } from '../lib/format'
import { cn } from '../lib/cn'

export default function Profile() {
  const storeUser = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [user, setLocalUser] = useState<User | null>(storeUser)
  const [modalOpen, setModalOpen] = useState(false)

  const [mbti, setMbti] = useState('')
  const [bdYear, setBdYear] = useState('')
  const [bdMonth, setBdMonth] = useState('')
  const [bdDay, setBdDay] = useState('')
  const [activeTitle, setActiveTitle] = useState('')
  const [textFields, setTextFields] = useState<Record<ProfileTextFieldKey, string>>(
    () => Object.fromEntries(PROFILE_TEXT_FIELDS.map((f) => [f.key, ''])) as Record<ProfileTextFieldKey, string>,
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!storeUser) return
    supabase
      .from('users')
      .select('*')
      .eq('id', storeUser.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setLocalUser(data as User)
      })
  }, [storeUser])

  if (!user) return <Page><Loading /></Page>

  const openModal = () => {
    setMbti(user.mbti ?? '')
    setActiveTitle(user.title ?? '')
    setTextFields(
      Object.fromEntries(
        PROFILE_TEXT_FIELDS.map((f) => [f.key, (user[f.key] as string | null) ?? '']),
      ) as Record<ProfileTextFieldKey, string>,
    )
    const bd = user.birthday ?? ''
    if (bd.length === 10 && bd[4] === '.') {
      const parts = bd.split('.')
      setBdYear(parts[0])
      setBdMonth(String(parseInt(parts[1])))
      setBdDay(String(parseInt(parts[2])))
    } else if (bd.length === 6) {
      setBdYear('')
      setBdMonth(String(parseInt(bd.slice(2, 4))))
      setBdDay(String(parseInt(bd.slice(4, 6))))
    } else {
      setBdYear(''); setBdMonth(''); setBdDay('')
    }
    setSaved(false)
    setError(null)
    setModalOpen(true)
  }

  const buildBirthday = () => {
    if (!bdYear || !bdMonth || !bdDay) return ''
    return `${bdYear.padStart(4, '0')}.${bdMonth.padStart(2, '0')}.${bdDay.padStart(2, '0')}`
  }

  const save = async () => {
    setSaving(true)
    setSaved(false)
    setError(null)
    const birthday = buildBirthday()
    const textUpdates = Object.fromEntries(
      PROFILE_TEXT_FIELDS.map((f) => [f.key, textFields[f.key].trim() || null]),
    )
    const { data, error } = await supabase
      .from('users')
      .update({ mbti: mbti || null, birthday, title: activeTitle, ...textUpdates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('*')
      .maybeSingle()
    setSaving(false)
    if (error) { setError(error.message); return }
    if (data) { setUser(data as User); setLocalUser(data as User) }
    setSaved(true)
  }

  const displayBirthday = user.birthday ? formatBirthday(user.birthday) : null

  return (
    <Page>
      <PageHeader title="내 프로필" />
      <div className="max-w-lg">
        <Card className="flex flex-col gap-5">

          {/* 프로필 이미지 + 기본 정보 */}
          <div className="flex items-center gap-4">
            {user.profile_image ? (
              <img src={user.profile_image} alt={user.name} className="h-16 w-16 shrink-0 rounded-full object-cover" />
            ) : (
              <Avatar name={user.name} size={64} />
            )}
            <div className="min-w-0 flex-1">
              {user.title && (
                <div className="mb-0.5 text-xs font-medium text-[--color-accent]">{user.title}</div>
              )}
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="shrink-0 text-[11px] font-semibold text-[--color-text-muted]">Lv.{user.level ?? 1}</span>
                    <span className="truncate text-base font-semibold text-[--color-text]">{user.kakao_name || user.name}</span>
                  </div>
                  <div className="text-xs text-[--color-text-muted]">@{user.name}</div>
                </div>
                <button
                  type="button"
                  onClick={openModal}
                  aria-label="프로필 설정"
                  className="shrink-0 rounded-lg p-1.5 text-[--color-text-muted] transition-colors hover:bg-[--color-surface-2] hover:text-[--color-text]"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* 스탯 */}
          <div className="grid grid-cols-3 gap-3">
            <StatBox label="레벨" value={`Lv.${user.level ?? 1}`} />
            <StatBox label="포인트" value={(user.point ?? 0).toLocaleString('ko-KR')} />
            <StatBox label="경험치" value={(user.exp ?? 0).toLocaleString('ko-KR')} />
          </div>

          {/* 표시 전용 정보 */}
          <div className="flex flex-col gap-2">
            <InfoRow label="MBTI" value={user.mbti ?? '미설정'} />
            <InfoRow label="생일" value={displayBirthday ?? '미설정'} />
            {PROFILE_TEXT_FIELDS.map((f) => (
              <InfoRow
                key={f.key}
                label={f.label}
                value={(user[f.key] as string | null) || '미설정'}
              />
            ))}
          </div>

          <div className="pt-4 text-xs text-[--color-text-muted]" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            채팅 {user.chat_count.toLocaleString('ko-KR')} · 가입일 {formatDate(user.created_at)}
          </div>
        </Card>
      </div>

      {/* 설정 모달 */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl"
            style={{
              background: 'var(--color-surface-2)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-sm font-semibold text-[--color-text]">프로필 설정</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="닫기"
                className="rounded-md p-1 text-[--color-text-muted] transition-colors hover:bg-white/[.08] hover:text-[--color-text]"
              >
                <X size={16} />
              </button>
            </div>

            {/* 바디 */}
            <div className="max-h-[60vh] overflow-y-auto">

              {/* 칭호 */}
              {user.titles && user.titles.length > 0 && (
                <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[--color-text-muted]">대표 칭호</div>
                  <div className="overflow-hidden rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <TitleRow
                      label="없음"
                      selected={activeTitle === ''}
                      onClick={() => setActiveTitle('')}
                      muted
                    />
                    {user.titles.map((t, i) => (
                      <div key={t} style={i < user.titles.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.06)' } : undefined}>
                        <TitleRow
                          label={t}
                          selected={t === activeTitle}
                          onClick={() => setActiveTitle(t)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MBTI + 생일 */}
              <div className="flex flex-col gap-4 px-5 py-4">
                <ModalField label="MBTI">
                  <select
                    value={mbti}
                    onChange={(e) => setMbti(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm text-[--color-text] focus:outline-none"
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <option value="">없음</option>
                    {MBTI_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </ModalField>

                <ModalField label="생일">
                  <div className="flex gap-2">
                    <Input
                      value={bdYear}
                      onChange={(e) => setBdYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="연도"
                      inputMode="numeric"
                      className="flex-[5]"
                    />
                    <Input
                      value={bdMonth}
                      onChange={(e) => setBdMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      placeholder="월"
                      inputMode="numeric"
                      className="flex-[3]"
                    />
                    <Input
                      value={bdDay}
                      onChange={(e) => setBdDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      placeholder="일"
                      inputMode="numeric"
                      className="flex-[3]"
                    />
                  </div>
                </ModalField>

                {PROFILE_TEXT_FIELDS.map((f) => (
                  <ModalField key={f.key} label={f.label}>
                    <Input
                      value={textFields[f.key]}
                      onChange={(e) =>
                        setTextFields((prev) => ({
                          ...prev,
                          [f.key]: e.target.value.slice(0, PROFILE_FIELD_MAX),
                        }))
                      }
                      placeholder={f.placeholder}
                      maxLength={PROFILE_FIELD_MAX}
                    />
                  </ModalField>
                ))}
              </div>
            </div>

            {/* 푸터 */}
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Button onClick={save} loading={saving}>저장</Button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-[--color-accent]">
                  <Check size={14} />
                  저장되었습니다
                </span>
              )}
              {error && <span className="text-sm text-red-400">{error}</span>}
            </div>
          </div>
        </div>
      )}
    </Page>
  )
}

function TitleRow({ label, selected, onClick, muted }: {
  label: string
  selected: boolean
  onClick: () => void
  muted?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between px-4 py-3 text-sm transition-colors text-left',
        selected
          ? 'bg-[--color-accent]/15 text-[--color-accent]'
          : muted
            ? 'text-[--color-text-muted] hover:bg-[--color-surface-2]/50 hover:text-[--color-text]'
            : 'text-[--color-text] hover:bg-[--color-surface-2]/50',
      )}
    >
      <span className={cn('font-medium', selected && 'font-semibold')}>{label}</span>
      {selected && <Check size={14} className="shrink-0" />}
    </button>
  )
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[--color-text-muted]">{label}</div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[--color-text-muted]">{label}</span>
      <span className="text-[--color-text]">{value}</span>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[--color-surface-2] p-3 text-center">
      <div className="text-xs text-[--color-text-muted]">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-[--color-text]">{value}</div>
    </div>
  )
}
