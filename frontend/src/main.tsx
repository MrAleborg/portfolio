import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createHttpCertificationRepository } from '@/infrastructure/certification/httpCertificationRepository'
import { createHttpCommitmentRepository } from '@/infrastructure/commitment/httpCommitmentRepository'
import { createHttpContactRepository } from '@/infrastructure/contact/httpContactRepository'
import { createHttpEducationRepository } from '@/infrastructure/education/httpEducationRepository'
import { createHttpHobbyRepository } from '@/infrastructure/hobby/httpHobbyRepository'
import { createHttpProfessionalExperienceRepository } from '@/infrastructure/professionalExperience/httpProfessionalExperienceRepository'
import { createHttpProfileRepository } from '@/infrastructure/profile/httpProfileRepository'
import { createHttpProjectRepository } from '@/infrastructure/project/httpProjectRepository'
import { createHttpScientificCommunicationRepository } from '@/infrastructure/scientificCommunication/httpScientificCommunicationRepository'
import { createHttpSpecializationRepository } from '@/infrastructure/specialization/httpSpecializationRepository'
import { createHttpTagRepository } from '@/infrastructure/tag/httpTagRepository'

const apiUrl = import.meta.env.VITE_API_URL

const repositories = {
  profile: createHttpProfileRepository(apiUrl),
  tag: createHttpTagRepository(apiUrl),
  experience: createHttpProfessionalExperienceRepository(apiUrl),
  project: createHttpProjectRepository(apiUrl),
  education: createHttpEducationRepository(apiUrl),
  certification: createHttpCertificationRepository(apiUrl),
  specialization: createHttpSpecializationRepository(apiUrl),
  scientificCommunication: createHttpScientificCommunicationRepository(apiUrl),
  commitment: createHttpCommitmentRepository(apiUrl),
  hobby: createHttpHobbyRepository(apiUrl),
  contact: createHttpContactRepository(apiUrl),
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App repositories={repositories} />
  </StrictMode>,
)
