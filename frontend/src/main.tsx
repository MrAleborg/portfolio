import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createHttpEducationRepository } from '@/infrastructure/education/httpEducationRepository'
import { createHttpProfileRepository } from '@/infrastructure/profile/httpProfileRepository'

const apiUrl = import.meta.env.VITE_API_URL

const repositories = {
  profile: createHttpProfileRepository(apiUrl),
  education: createHttpEducationRepository(apiUrl),
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App repositories={repositories} />
  </StrictMode>,
)
