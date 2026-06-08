import type { MeetingItem } from '../types'

export interface Transfer {
  from: string // user id (payer/ower)
  to: string // user id (receiver)
  amount: number
}

export interface SettlementResult {
  total: number
  perHead: number // when everything split equally; rough indicator
  balances: Record<string, number> // +receive / -owe
  transfers: Transfer[]
}

// Splits items across members. payer_id=null → split equally among everyone.
// payer_id set → that member fronted the cost; others owe their equal share.
export function computeSettlement(memberIds: string[], items: MeetingItem[]): SettlementResult {
  const n = memberIds.length
  const balances: Record<string, number> = {}
  for (const id of memberIds) balances[id] = 0

  let total = 0
  for (const item of items) {
    total += item.amount
    if (n === 0) continue
    const share = item.amount / n
    // everyone consumes an equal share
    for (const id of memberIds) balances[id] -= share
    // the payer fronted the money (null = split with no single payer → no credit)
    if (item.payer_id && balances[item.payer_id] !== undefined) {
      balances[item.payer_id] += item.amount
    }
  }

  // round to integer won
  for (const id of memberIds) balances[id] = Math.round(balances[id])

  const transfers = minimizeTransfers(balances)
  return { total, perHead: n ? Math.round(total / n) : 0, balances, transfers }
}

function minimizeTransfers(balances: Record<string, number>): Transfer[] {
  const debtors: { id: string; amt: number }[] = []
  const creditors: { id: string; amt: number }[] = []
  for (const [id, v] of Object.entries(balances)) {
    if (v < 0) debtors.push({ id, amt: -v })
    else if (v > 0) creditors.push({ id, amt: v })
  }
  debtors.sort((a, b) => b.amt - a.amt)
  creditors.sort((a, b) => b.amt - a.amt)

  const transfers: Transfer[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt)
    if (pay > 0) {
      transfers.push({ from: debtors[i].id, to: creditors[j].id, amount: pay })
    }
    debtors[i].amt -= pay
    creditors[j].amt -= pay
    if (debtors[i].amt === 0) i++
    if (creditors[j].amt === 0) j++
  }
  return transfers
}
