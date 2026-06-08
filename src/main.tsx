import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './router'
import { restoreSession } from './lib/auth'
import { Loading } from './components/ui/States'

function Root() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    restoreSession().finally(() => setReady(true))
  }, [])

  if (!ready) return <Loading fullScreen />
  return <RouterProvider router={router} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
