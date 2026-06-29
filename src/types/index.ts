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
  drink_capacity: string | null    // 주량
  meetup_available: string | null   // 벙참가능유무
  meetup_time: string | null        // 벙참가능시간
  self_style: string | null         // 본인 스타일
  ideal_type: string | null         // 이상형
  status_msg: string | null         // 현 상태
  blood_type: string | null         // 혈액형
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

export interface UserWarning {
  id: string
  user_id: string
  reason: string
  warned_by: string        // 경고한 유저 id
  created_at: string       // 경고일자
}

export interface Meeting {
  id: string
  name: string
  date: string              // "YYYY-MM-DD", kept for compat
  start_time: string | null // ISO timestamptz
  end_time: string | null   // ISO timestamptz (null = single-day or open-ended)
  description: string | null
  created_by: string
  host_id: string | null    // first joiner, or creator if they joined on creation
  settled: boolean
  min_members: number | null
  max_members: number | null
  deadline: string | null   // ISO timestamptz — registration closes at this time
  created_at: string
}

export interface MeetingMember {
  meeting_id: string
  user_id: string
  joined_at: string
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

// 유저가 자유롭게 입력하는 평문 프로필 필드 (각 최대 30자)
export const PROFILE_TEXT_FIELDS = [
  { key: 'drink_capacity', label: '주량', placeholder: '예: 소주 1병' },
  { key: 'meetup_available', label: '벙참가능유무', placeholder: '예: 가능' },
  { key: 'meetup_time', label: '벙참가능시간', placeholder: '예: 평일 저녁' },
  { key: 'self_style', label: '본인 스타일', placeholder: '예: 활발한 편' },
  { key: 'ideal_type', label: '이상형', placeholder: '예: 다정한 사람' },
  { key: 'status_msg', label: '현 상태', placeholder: '예: 모쏠' },
  { key: 'blood_type', label: '혈액형', placeholder: '예: A형' },
] as const

export const PROFILE_FIELD_MAX = 30

export type ProfileTextFieldKey = (typeof PROFILE_TEXT_FIELDS)[number]['key']

export const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
] as const
