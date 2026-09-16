import { createContext, useContext, useEffect, useState } from 'react'
import apiClient from '../api/client'
import { lireMoi } from '../api/ressources'

const AuthContext = createContext(null)

// Niveaux autorisés à effectuer les actions d'écriture "métier"
// (dépôts, ventes, retours, encaissements, clients/marchands,
// réservations) — le comptable reste en lecture seule sur ces écrans.
// Doit rester cohérent avec core/permissions.py côté backend.
const NIVEAUX_ECRITURE_OPERATIONNELLE = ['ADMIN', 'PDG', 'OPERATIONNEL']
const NIVEAUX_DIRECTION = ['ADMIN', 'PDG']

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [moi, setMoi] = useState(null)

  useEffect(() => {
    if (!token) {
      setMoi(null)
      return
    }
    let annule = false
    lireMoi()
      .then((donnees) => {
        if (!annule) setMoi(donnees)
      })
      .catch(() => {
        if (!annule) setMoi(null)
      })
    return () => {
      annule = true
    }
  }, [token])

  async function login(username, password) {
    const { data } = await apiClient.post('/auth/token/', { username, password })
    localStorage.setItem('token', data.token)
    setToken(data.token)
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setMoi(null)
  }

  const niveau = moi?.niveau_acces ?? null
  // Tant que le rôle n'est pas encore connu (chargement de /auth/moi/),
  // on n'affiche pas encore un menu restreint par défaut : le serveur
  // reste de toute façon la seule vraie barrière de sécurité.
  const peut = {
    ecrireOperations: niveau === null || NIVEAUX_ECRITURE_OPERATIONNELLE.includes(niveau),
    gererPersonnels: niveau === null || NIVEAUX_DIRECTION.includes(niveau),
    gererCatalogue: niveau === null || NIVEAUX_DIRECTION.includes(niveau),
  }

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated: Boolean(token), login, logout, moi, niveau, peut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider')
  }
  return context
}
