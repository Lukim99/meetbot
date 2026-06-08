export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// "041006" -> "10월 06일"
export function formatBirthday(yymmdd: string): string {
  if (!yymmdd || yymmdd.length !== 6) return yymmdd || '-'
  const mm = yymmdd.slice(2, 4)
  const dd = yymmdd.slice(4, 6)
  return `${mm}월 ${dd}일`
}

export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

export function initial(name: string): string {
  return name?.trim()?.charAt(0) ?? '?'
}
