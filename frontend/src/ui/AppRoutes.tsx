import { Navigate, Route, Routes } from 'react-router'
import type { ProfileRepository } from '@/domain/profile/ProfileRepository'
import { Layout } from '@/ui/layout/Layout'
import { HomePage } from '@/ui/pages/HomePage'
import { ResumePage } from '@/ui/pages/ResumePage'

interface AppRoutesProps {
  profileRepository: ProfileRepository
}

export function AppRoutes({ profileRepository }: AppRoutesProps) {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          index
          element={<HomePage profileRepository={profileRepository} />}
        />
        <Route path="resume" element={<ResumePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
