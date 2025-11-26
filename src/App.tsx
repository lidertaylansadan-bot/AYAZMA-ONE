import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Suspense, lazy } from "react"
import { ProtectedRoute } from "./components/ProtectedRoute"
import Spinner from "./components/ui/Spinner"

// Lazy load pages
const Login = lazy(() => import("./pages/Login").then(module => ({ default: module.Login })))
const Register = lazy(() => import("./pages/Register").then(module => ({ default: module.Register })))
const Dashboard = lazy(() => import("./pages/Dashboard").then(module => ({ default: module.Dashboard })))
const Cockpit = lazy(() => import("./pages/Cockpit"))
const AppWizard = lazy(() => import("./pages/AppWizard").then(module => ({ default: module.AppWizard })))
const AiPlayground = lazy(() => import("./pages/AiPlayground"))
const AgentsList = lazy(() => import("./pages/AgentsList"))
const AgentRunDetail = lazy(() => import("./pages/AgentRunDetail"))
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"))
const AnalyticsAi = lazy(() => import("./pages/AnalyticsAi"))
const ProjectContentPlanner = lazy(() => import("./pages/ProjectContentPlanner"))
const Admin = lazy(() => import("./pages/Admin"))
const ControlPanel = lazy(() => import("./pages/ControlPanel"))
const AuditLog = lazy(() => import("./pages/AuditLog"))

function AppRoutes() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner /></div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/cockpit" replace />} />

        <Route path="/cockpit" element={<ProtectedRoute><Cockpit /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        <Route path="/projects" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />

        <Route
          path="/wizard/app"
          element={
            <ProtectedRoute>
              <AppWizard />
            </ProtectedRoute>
          }
        />
        <Route path="/ai" element={<ProtectedRoute><AiPlayground /></ProtectedRoute>} />
        <Route path="/agents" element={<ProtectedRoute><AgentsList /></ProtectedRoute>} />
        <Route path="/agents/runs/:id" element={<ProtectedRoute><AgentRunDetail /></ProtectedRoute>} />
        <Route path="/analytics/ai" element={<ProtectedRoute><AnalyticsAi /></ProtectedRoute>} />
        <Route path="/projects/:id/content" element={<ProtectedRoute><ProjectContentPlanner /></ProtectedRoute>} />

        {/* Admin Route */}
        <Route path="/admin" element={<Admin />} />

        {/* Control Panel Route */}
        <Route path="/control-panel" element={<ProtectedRoute><ControlPanel /></ProtectedRoute>} />

        {/* Audit Log Route */}
        <Route path="/audit-log" element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}
