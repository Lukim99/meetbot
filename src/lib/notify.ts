// 카카오톡 채널로 알림을 전송한다. (KakaoTalk 봇 서버의 send-kakao API)
const KAKAO_API_URL = 'https://rpgenius.kro.kr/send-kakao'
const KAKAO_API_KEY = 'delutive-kakao-1mdk2kfe'
const KAKAO_CHANNEL_ID = import.meta.env.VITE_KAKAO_CHANNEL_ID as string | undefined

export async function sendKakao(content: string): Promise<void> {
  if (!KAKAO_CHANNEL_ID) {
    console.warn('VITE_KAKAO_CHANNEL_ID 가 설정되지 않아 카카오 알림을 건너뜁니다.')
    return
  }
  try {
    await fetch(KAKAO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': KAKAO_API_KEY },
      body: JSON.stringify({ channelId: KAKAO_CHANNEL_ID, content }),
    })
  } catch (e) {
    // 알림 실패가 일정 생성 흐름을 막지 않도록 조용히 처리
    console.error('카카오 알림 전송 실패', e)
  }
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export interface NewMeetingNotice {
  name: string
  startISO: string
  deadlineISO: string | null
  minMembers: number | null
  maxMembers: number | null
  hostName: string | null
  description: string | null
}

export function buildNewMeetingMessage(m: NewMeetingNotice): string {
  const lines = [
    '📅 새로운 일정이 추가되었습니다.',
    '',
    `[ ${m.name} ]`,
    `- 일시: ${fmtDateTime(m.startISO)}`,
    `- 마감: ${m.deadlineISO ? fmtDateTime(m.deadlineISO) : '없음'}`,
  ]

  if (m.minMembers != null && m.maxMembers != null) {
    lines.push(`- 인원: ${m.minMembers}~${m.maxMembers}명`)
  } else if (m.minMembers != null) {
    lines.push(`- 인원: 최소 ${m.minMembers}명`)
  } else if (m.maxMembers != null) {
    lines.push(`- 인원: 최대 ${m.maxMembers}명`)
  }

  lines.push(`- 모임장: ${m.hostName || '없음'}`)

  if (m.description) {
    lines.push('', m.description)
  }

  return lines.join('\n')
}
