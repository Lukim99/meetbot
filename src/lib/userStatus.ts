import type { UserLogs } from '../types'

function latestDate(arr?: { date: string }[]): string | null {
  if (!arr || arr.length === 0) return null
  return arr.reduce((max, e) => (e.date > max ? e.date : max), arr[0].date)
}

// 가장 최근 퇴장(나가기/강퇴) 로그가 가장 최근 입장 로그보다 나중이면 현재 퇴장 상태로 본다.
export function hasLeft(logs?: UserLogs | null): boolean {
  if (!logs) return false
  const lastExit = latestDate(logs.exit)
  if (!lastExit) return false
  const lastEntry = latestDate(logs.entry)
  if (!lastEntry) return true
  return new Date(lastExit).getTime() > new Date(lastEntry).getTime()
}
