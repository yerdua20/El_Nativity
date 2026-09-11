import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import RouteProtegee from './auth/RouteProtegee'
import Carte from './pages/Carte'
import Catalogue from './pages/Catalogue'
import Clients from './pages/Clients'
import Commerciaux from './pages/Commerciaux'
import Dashboard from './pages/Dashboard'
import Encaissement from './pages/Encaissement'
import FicheClient from './pages/FicheClient'
import FicheCommercial from './pages/FicheCommercial'
import Historique from './pages/Historique'
import Login from './pages/Login'
import Marchands from './pages/Marchands'
import Profil from './pages/Profil'
import Reservations from './pages/Reservations'
import Retours from './pages/Retours'
import Stock from './pages/Stock'
import VenteDeclaree from './pages/VenteDeclaree'
import VenteDirecte from './pages/VenteDirecte'

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
          <Route path="/clients" element={protegee(<Clients />)} />
          <Route path="/clients/:id" element={protegee(<FicheClient />)} />
          <Route path="/marchands" element={protegee(<Marchands />)} />
          <Route path="/carte" element={protegee(<Carte />)} />
          <Route path="/commerciaux" element={protegee(<Commerciaux />)} />
          <Route path="/commerciaux/:id" element={protegee(<FicheCommercial />)} />
          <Route path="/stock" element={protegee(<Stock />)} />
          <Route path="/vente" element={protegee(<VenteDeclaree />)} />
          <Route path="/vente-directe" element={protegee(<VenteDirecte />)} />
          <Route path="/reservations" element={protegee(<Reservations />)} />
          <Route path="/retours" element={protegee(<Retours />)} />
          <Route path="/encaissement" element={protegee(<Encaissement />)} />
          <Route path="/historique" element={protegee(<Historique />)} />
          <Route path="/catalogue" element={protegee(<Catalogue />)} />
          <Route path="/profil" element={protegee(<Profil />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
