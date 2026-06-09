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

// "YYYY.MM.DD" -> "YYYY년 MM월 DD일" (new format)
// "YYMMDD"    -> "MM월 DD일"        (legacy)
export function formatBirthday(birthday: string): string {
  if (!birthday) return '-'
  if (birthday.length === 10 && birthday[4] === '.' && birthday[7] === '.') {
    const [yyyy, mm, dd] = birthday.split('.')
    return `${yyyy}년 ${mm}월 ${dd}일`
  }
  if (birthday.length === 6) {
    return `${birthday.slice(2, 4)}월 ${birthday.slice(4, 6)}일`
  }
  return birthday || '-'
}

export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

export function initial(name: string): string {
  return name?.trim()?.charAt(0) ?? '?'
}
