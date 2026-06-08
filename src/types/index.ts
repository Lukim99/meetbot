export interface LogEntry {
  date: string
  name: string
}

export interface LogExit {
  date: string
  name: string
  cause: '나가기' | '강퇴'
  kicked_by: string | null
}

export interface LogChangeName {
  date: string
  old_name: string
  new_name: string
}

export interface UserLogs {
  entry: LogEntry[]
  exit: LogExit[]
  change_name: LogChangeName[]
}

export interface User {
  id: string
  name: string
  kakao_name: string
  code: string
  logged_in: string[]
  logged_in_agent: string[]
  birthday: string
  chat_count: number
  logs: UserLogs
  permission: number[]
  titles: string[]
  title: string
  mbti: string | null
  profile_image: string | null
  exp: number
  level: number
  attend_at: string | null
  point: number
  created_at: string
  updated_at: string
}

export interface TitleItem {
  id: string
  name: string
  created_at: string
}

export interface Meeting {
  id: string
  name: string
  date: string
  description: string | null
  created_by: string
  settled: boolean
  created_at: string
}

export interface MeetingMember {
  meeting_id: string
  user_id: string
}

export interface MeetingItem {
  id: string
  meeting_id: string
  label: string
  amount: number
  payer_id: string | null
}

export interface Command {
  id: string
  trigger: string
  response_text: string | null
  image_url: string | null
}

export interface WelcomeMessage {
  id: number
  text: string | null
  image_url: string | null
}

export const PERM_OWNER = 1
export const PERM_ADMIN = 2

export const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
] as const
