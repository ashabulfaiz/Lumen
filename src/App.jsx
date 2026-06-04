import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import DashboardHome from './components/DashboardHome.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LearningPage from './pages/LearningPage.jsx'
import LearningPathStepPage from './pages/LearningPathStepPage.jsx'
import HelpPage from './pages/HelpPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import PlacementTestPage from './pages/PlacementTestPage.jsx'
import ProgressPage from './pages/ProgressPage.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import LevelDetailPage from './pages/LevelDetailPage.jsx'
import LessonPage from './pages/LessonPage.jsx'
import EssayPage from './pages/EssayPage.jsx'
import MaterialPage from './pages/MaterialPage.jsx'
import CertificatePage from './pages/CertificatePage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/learning" element={<LearningPage />} />
            <Route path="/learning/beginner" element={<LevelDetailPage />} />
            <Route path="/learning/intermediate" element={<LevelDetailPage />} />
            <Route path="/learning/advanced" element={<LevelDetailPage />} />
            <Route path="/learning/:level/lesson/:lessonId/material" element={<MaterialPage />} />
            <Route path="/learning/:level/lesson/:lessonId" element={<LessonPage />} />
            <Route path="/learning/:level/lesson/:lessonId/writing" element={<EssayPage />} />
            <Route path="/learning/introduction" element={<LearningPathStepPage />} />
            <Route path="/learning/placement" element={<LearningPathStepPage />} />
            <Route path="/learning/placement/test" element={<PlacementTestPage />} />
            <Route path="/learning/levels" element={<LearningPathStepPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/certification" element={<CertificatePage />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}