import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createHttpProfileRepository } from '@/infrastructure/profile/httpProfileRepository'

const profileRepository = createHttpProfileRepository(
  import.meta.env.VITE_API_URL,
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App profileRepository={profileRepository} />
  </StrictMode>,
)
