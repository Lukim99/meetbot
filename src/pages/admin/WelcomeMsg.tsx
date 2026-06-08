import { useEffect, useRef, useState } from 'react'
import { Check, ImagePlus, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { uploadImage } from '../../lib/storage'
import type { WelcomeMessage } from '../../types'
import { Page, PageHeader } from '../../components/ui/Page'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Loading } from '../../components/ui/States'

export default function WelcomeMsg() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('welcome_message')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        const w = data as WelcomeMessage | null
        setText(w?.text ?? '')
        setImageUrl(w?.image_url ?? null)
        setLoaded(true)
      })
  }, [])

  const onFile = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const url = await uploadImage('welcome-images', file)
      setImageUrl(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : '업로드 실패')
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setSaved(false)
    setError(null)
    const { error } = await supabase
      .from('welcome_message')
      .upsert({ id: 1, text: text.trim() || null, image_url: imageUrl })
    setSaving(false)
    if (error) setError(error.message)
    else setSaved(true)
  }

  if (!loaded) return <Page><Loading /></Page>

  return (
    <Page>
      <PageHeader title="입장 메시지 설정" />
      <div className="max-w-2xl">
        <Card className="flex flex-col gap-5">
          <div>
            <label className="mb-1.5 block text-xs text-[--color-text-muted]">메시지</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-lg border border-[--color-border] bg-[--color-surface-2] px-3 py-2 text-sm text-[--color-text] placeholder:text-[--color-text-muted] focus:border-[--color-accent] focus:outline-none"
              placeholder="신규 입장 시 전송할 메시지"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-[--color-text-muted]">이미지</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
            {imageUrl ? (
              <div className="relative inline-block">
                <img
                  src={imageUrl}
                  alt="입장 이미지 미리보기"
                  className="max-w-full h-auto max-h-60 rounded-lg border border-[--color-border]"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  aria-label="이미지 제거"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <Button
                variant="ghost"
                onClick={() => fileRef.current?.click()}
                loading={uploading}
              >
                <ImagePlus size={16} />
                이미지 업로드
              </Button>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center gap-3">
            <Button onClick={save} loading={saving}>
              저장
            </Button>
            {saved && (
              <span className="flex items-center gap-1 text-sm text-[--color-accent]">
                <Check size={16} />
                저장되었습니다
              </span>
            )}
          </div>
        </Card>
      </div>
    </Page>
  )
}
