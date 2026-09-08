import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function RouteProtegee({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/connexion" replace />
}
