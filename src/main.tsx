import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import Game from './Game.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Game />
    <SpeedInsights />
  </StrictMode>,
)
