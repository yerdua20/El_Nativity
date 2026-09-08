import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import RouteProtegee from './auth/RouteProtegee'
import AffectationCommercial from './pages/AffectationCommercial'
import Catalogue from './pages/Catalogue'
import Clients from './pages/Clients'
import Commerciaux from './pages/Commerciaux'
import Dashboard from './pages/Dashboard'
import Encaissement from './pages/Encaissement'
import FicheClient from './pages/FicheClient'
import FileAttente from './pages/FileAttente'
import Historique from './pages/Historique'
import Login from './pages/Login'
import NouveauDepot from './pages/NouveauDepot'
import Retours from './pages/Retours'
import VenteDeclaree from './pages/VenteDeclaree'

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
          <Route path="/commerciaux" element={protegee(<Commerciaux />)} />
          <Route path="/depot" element={protegee(<NouveauDepot />)} />
          <Route path="/vente" element={protegee(<VenteDeclaree />)} />
          <Route path="/retours" element={protegee(<Retours />)} />
          <Route path="/affectation" element={protegee(<AffectationCommercial />)} />
          <Route path="/encaissement" element={protegee(<Encaissement />)} />
          <Route path="/historique" element={protegee(<Historique />)} />
          <Route path="/synchro" element={protegee(<FileAttente />)} />
          <Route path="/catalogue" element={protegee(<Catalogue />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
