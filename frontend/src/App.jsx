import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import RouteProtegee from './auth/RouteProtegee'
import AffectationCommercial from './pages/AffectationCommercial'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'

function protegee(element) {
  return <RouteProtegee>{element}</RouteProtegee>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/connexion" element={<Login />} />
          <Route path="/" element={protegee(<Dashboard />)} />
          <Route path="/affectation" element={protegee(<AffectationCommercial />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
