import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { buildFrameAncestorsCsp } from './config/embedHeaders'

const embedCsp = buildFrameAncestorsCsp(true)
const embedHeaders = {
  'Content-Security-Policy': embedCsp,
}

export default defineConfig({
  plugins: [react()],
  server: { headers: embedHeaders },
  preview: { headers: embedHeaders },
})
