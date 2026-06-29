import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { login, NeedCodeError } from '../lib/auth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = location.pathname.startsWith('/m/')

  const [step, setStep] = useState<'name' | 'code'>('name')
  const [name, setName] = useState('')

  const handleNameChange = (value: string) => {
    const filtered = value.replace(/[^ㄱ-ㅣㆍ가-힣a-zA-Z0-9_.]/g, '')
    setName(filtered)
  }
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(name, step === 'code' ? code : undefined)
      navigate(isMobile ? '/m/ranking' : '/ranking', { replace: true })
    } catch (err) {
      if (err instanceof NeedCodeError) {
        setStep('code')
      } else {
        setError(err instanceof Error ? err.message : '로그인에 실패했습니다')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden px-4 py-16">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(124,142,245,0.1) 0%, transparent 65%)' }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'linear-gradient(135deg,#818cf8,#6366f1)', boxShadow: '0 4px 20px rgba(129,140,248,0.35)' }}
          >
            <MessageCircle size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)]">월루</h1>
          <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">서울·경기 반말방</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-2xl bg-[var(--color-surface)] p-6 shadow-[0_4px_32px_rgba(0,0,0,0.5)]"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
              로그인
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-[var(--color-text-muted)]">
                @
              </span>
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="핸들을 입력하세요"
                disabled={step === 'code' || loading}
                autoFocus
                className="pl-7"
              />
            </div>
          </div>

          {step === 'code' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
                인증 코드
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="코드를 입력하세요"
                disabled={loading}
                autoFocus
              />
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                처음 사용하는 기기입니다. 코드로 인증해 주세요.
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} fullWidth>
            {step === 'name' ? '다음' : '로그인'}
          </Button>
        </form>
      </div>
    </div>
  )
}
