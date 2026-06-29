import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, ImagePlus, X, Terminal } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { uploadImage } from '../../lib/storage'
import type { Command } from '../../types'
import { Page, PageHeader } from '../../components/ui/Page'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Loading, ErrorState, EmptyState } from '../../components/ui/States'

const EMPTY = { trigger: '', response_text: '', image_url: null as string | null }

export default function Commands() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<Command[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    supabase
      .from('commands')
      .select('*')
      .order('trigger')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setRows((data ?? []) as Command[])
        setLoading(false)
      })
  }
  useEffect(load, [])

  const openNew = () => {
    setEditId(null)
    setForm(EMPTY)
    setOpen(true)
  }
  const openEdit = (c: Command) => {
    setEditId(c.id)
    setForm({ trigger: c.trigger, response_text: c.response_text ?? '', image_url: c.image_url })
    setOpen(true)
  }

  const onFile = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadImage('command-images', file)
      setForm((f) => ({ ...f, image_url: url }))
    } catch (e) {
      setError(e instanceof Error ? e.message : '업로드 실패')
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    if (!form.trigger.trim()) return
    setSaving(true)
    const payload = {
      trigger: form.trigger.trim(),
      response_text: form.response_text.trim() || null,
      image_url: form.image_url,
    }
    const { error } = editId
      ? await supabase.from('commands').update(payload).eq('id', editId)
      : await supabase.from('commands').insert(payload)
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setOpen(false)
    load()
  }

  const remove = async (c: Command) => {
    if (!confirm(`"${c.trigger}" 명령어를 삭제할까요?`)) return
    await supabase.from('commands').delete().eq('id', c.id)
    load()
  }

  return (
    <Page>
      <PageHeader
        title="명령어 관리"
        actions={
          <Button onClick={openNew}>
            <Plus size={16} />
            명령어 추가
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Terminal} message="등록된 명령어가 없습니다" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-text-muted)]">
                <th className="px-4 py-3 text-left">트리거</th>
                <th className="px-4 py-3 text-left">응답</th>
                <th className="w-20 px-4 py-3 text-center">이미지</th>
                <th className="w-24 px-4 py-3 text-right">액션</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-[var(--color-border)]">
                  <td className="px-4 py-3 font-medium text-[var(--color-text)]">{c.trigger}</td>
                  <td className="max-w-xs px-4 py-3">
                    <div className="truncate text-[var(--color-text-muted)]">
                      {c.response_text || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-[var(--color-text-muted)]">
                    {c.image_url ? 'O' : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        aria-label="수정"
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => remove(c)}
                        aria-label="삭제"
                        className="text-[var(--color-text-muted)] hover:text-red-400"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={open}
        title={editId ? '명령어 수정' : '명령어 추가'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button onClick={save} loading={saving} disabled={!form.trigger.trim()}>
              저장
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs text-[var(--color-text-muted)]">트리거</label>
            <Input
              value={form.trigger}
              onChange={(e) => setForm({ ...form, trigger: e.target.value })}
              placeholder="!명령어"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[var(--color-text-muted)]">응답 텍스트</label>
            <textarea
              value={form.response_text}
              onChange={(e) => setForm({ ...form, response_text: e.target.value })}
              rows={3}
              className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
              placeholder="자동 응답 내용"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[var(--color-text-muted)]">이미지 (선택)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
            {form.image_url ? (
              <div className="relative inline-block">
                <img
                  src={form.image_url}
                  alt="응답 이미지"
                  className="max-w-full h-auto max-h-40 rounded-lg border border-[var(--color-border)]"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image_url: null })}
                  aria-label="이미지 제거"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <Button variant="ghost" onClick={() => fileRef.current?.click()} loading={uploading}>
                <ImagePlus size={16} />
                이미지 업로드
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </Page>
  )
}
