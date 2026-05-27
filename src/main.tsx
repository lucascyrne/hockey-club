import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { PwaProvider } from './components/pwa/PwaProvider'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PwaProvider>
      <App />
    </PwaProvider>
  </StrictMode>,
)
