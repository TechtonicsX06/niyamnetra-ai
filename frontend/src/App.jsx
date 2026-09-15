import { Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import NewScanPage from './pages/NewScanPage.jsx'
import ProcessingPage from './pages/ProcessingPage.jsx'
import OcrResultsPage from './pages/OcrResultsPage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'
import ReportPage from './pages/ReportPage.jsx'
import AppShell from './components/layout/AppShell.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/scan" element={<NewScanPage />} />
        <Route path="/processing" element={<ProcessingPage />} />
        <Route path="/ocr-results" element={<OcrResultsPage />} />
        <Route path="/results/:scanId" element={<ResultsPage />} />
        <Route path="/report/:scanId" element={<ReportPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
