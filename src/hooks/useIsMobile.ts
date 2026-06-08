import { useContext } from 'react'
import { LayoutContext } from '../lib/layoutContext'

export function useIsMobile(): boolean {
  return useContext(LayoutContext).isMobile
}
