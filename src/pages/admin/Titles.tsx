import { useEffect, useState, type KeyboardEvent } from 'react'
import { Award, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { type TitleItem } from '../../types'
import { Page, PageHeader } from '../../components/ui/Page'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Loading, EmptyState } from '../../components/ui/States'

export default function Titles() {
  const [titles, setTitles] = useState<TitleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    supabase
      .from('titles')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setTitles((data ?? []) as TitleItem[])
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [])

  const add = async () => {
    const name = newName.trim()
    if (!name) return
    if (titles.some((t) => t.name === name)) {
      setError('이미 존재하는 칭호입니다')
      return
    }
    setAdding(true)
    setError(null)
    const { error } = await supabase.from('titles').insert({ name })
    if (error) { setError(error.message) }
    else { setNewName(''); load() }
    setAdding(false)
  }

  const remove = async (id: string) => {
    await supabase.from('titles').delete().eq('id', id)
    setTitles((prev) => prev.filter((t) => t.id !== id))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); add() }
  }

  return (
    <Page>
      <PageHeader title="칭호 관리" />

      <div className="max-w-lg">
        <div className="mb-4 flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="새 칭호 이름 입력"
          />
          <Button onClick={add} loading={adding} className="shrink-0">추가</Button>
        </div>
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        {loading ? (
          <Loading />
        ) : titles.length === 0 ? (
          <EmptyState icon={Award} message="등록된 칭호가 없습니다" />
        ) : (
          <div className="flex flex-col gap-1">
            {titles.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg bg-[--color-surface] px-4 py-3"
              >
                <span className="text-sm text-[--color-text]">{t.name}</span>
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  aria-label={`${t.name} 삭제`}
                  className="rounded-md p-1.5 text-[--color-text-muted] transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Page>
  )
}
