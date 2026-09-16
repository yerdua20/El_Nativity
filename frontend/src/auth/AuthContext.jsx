import { createContext, useContext, useEffect, useState } from 'react'
import apiClient from '../api/client'
import { lireMoi } from '../api/ressources'

const AuthContext = createContext(null)

// Périmètres distincts du gérant (bar/restaurant, réservations,
// personnel) et de la chargée des ventes (marchands, clients,
// dépôts/ventes/retours/encaissements) ; le comptable reste en
// lecture seule partout. Doit rester cohérent avec
// core/permissions.py côté backend.
const NIVEAUX_GERANT = ['ADMIN', 'PDG', 'GERANT']
const NIVEAUX_CHARGE_VENTES = ['ADMIN', 'PDG', 'CHARGE_VENTES']
const NIVEAUX_RECEPTION_STOCK = ['ADMIN', 'PDG', 'GERANT', 'CHARGE_VENTES']
const NIVEAUX_PERSONNELS = ['ADMIN', 'PDG', 'GERANT']
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
    gererVenteDirecte: niveau === null || NIVEAUX_GERANT.includes(niveau),
    gererReservations: niveau === null || NIVEAUX_GERANT.includes(niveau),
    gererMarchandsClients: niveau === null || NIVEAUX_CHARGE_VENTES.includes(niveau),
    receptionnerStock: niveau === null || NIVEAUX_RECEPTION_STOCK.includes(niveau),
    gererPersonnels: niveau === null || NIVEAUX_PERSONNELS.includes(niveau),
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
