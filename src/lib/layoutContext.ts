import { createContext } from 'react'

export const LayoutContext = createContext<{ isMobile: boolean }>({ isMobile: false })
