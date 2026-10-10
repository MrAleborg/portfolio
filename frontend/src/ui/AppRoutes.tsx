import { Navigate, Route, Routes } from 'react-router'
import { Layout } from '@/ui/layout/Layout'
import { ContactPage } from '@/ui/pages/ContactPage'
import { HomePage } from '@/ui/pages/HomePage'
import { ResumePage } from '@/ui/pages/ResumePage'
import type { Repositories } from '@/ui/Repositories'

interface AppRoutesProps {
  repositories: Repositories
}

export function AppRoutes({ repositories }: AppRoutesProps) {
  return (
    <Routes>
      <Route element={<Layout profileRepository={repositories.profile} />}>
        <Route
          index
          element={
            <HomePage
              profileRepository={repositories.profile}
              experienceRepository={repositories.experience}
            />
          }
        />
        <Route
          path="resume"
          element={<ResumePage repositories={repositories} />}
        />
        <Route
          path="contact"
          element={<ContactPage contactRepository={repositories.contact} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
