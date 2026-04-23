import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import DashboardHome from './components/DashboardHome.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LearningPage from './pages/LearningPage.jsx'
import LearningPathStepPage from './pages/LearningPathStepPage.jsx'
import HelpPage from './pages/HelpPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProgressPage from './pages/ProgressPage.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/sertifikasi" element={<Navigate to="/certification" replace />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/learning" element={<LearningPage />} />
          <Route path="/learning/introduction" element={<LearningPathStepPage />} />
          <Route path="/learning/placement" element={<LearningPathStepPage />} />
          <Route path="/learning/levels" element={<LearningPathStepPage />} />
          <Route path="/learning/practice" element={<LearningPathStepPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route
            path="/certification"
            element={
              <PlaceholderPage
                title="Certification"
                description="Earn a certificate after finishing a level or passing a final assessment."
              />
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
