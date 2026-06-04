import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { bootstrapAudio } from './audio/audioEngine'
import { App } from './app/App'
import { PwaProvider } from './components/pwa/PwaProvider'
import './index.css'

bootstrapAudio('menu')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PwaProvider>
      <App />
    </PwaProvider>
  </StrictMode>,
)
