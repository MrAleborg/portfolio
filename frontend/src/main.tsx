import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createHttpCommitmentRepository } from '@/infrastructure/commitment/httpCommitmentRepository'
import { createHttpEducationRepository } from '@/infrastructure/education/httpEducationRepository'
import { createHttpHobbyRepository } from '@/infrastructure/hobby/httpHobbyRepository'
import { createHttpProfileRepository } from '@/infrastructure/profile/httpProfileRepository'
import { createHttpScientificCommunicationRepository } from '@/infrastructure/scientificCommunication/httpScientificCommunicationRepository'

const apiUrl = import.meta.env.VITE_API_URL

const repositories = {
  profile: createHttpProfileRepository(apiUrl),
  education: createHttpEducationRepository(apiUrl),
  scientificCommunication: createHttpScientificCommunicationRepository(apiUrl),
  commitment: createHttpCommitmentRepository(apiUrl),
  hobby: createHttpHobbyRepository(apiUrl),
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App repositories={repositories} />
  </StrictMode>,
)
