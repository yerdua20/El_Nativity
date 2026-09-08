import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const lienClasse = ({ isActive }) =>
  `rounded px-3 py-1.5 text-sm whitespace-nowrap ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`

export default function Nav() {
  const { logout } = useAuth()

  return (
    <nav className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-6 pt-6">
      <div className="flex flex-wrap gap-2">
        <NavLink to="/" end className={lienClasse}>
          Tableau de bord
        </NavLink>
        <NavLink to="/clients" className={lienClasse}>
          Clients
        </NavLink>
        <NavLink to="/depot" className={lienClasse}>
          Nouveau dépôt
        </NavLink>
        <NavLink to="/vente" className={lienClasse}>
          Vente déclarée
        </NavLink>
        <NavLink to="/retours" className={lienClasse}>
          Retours
        </NavLink>
        <NavLink to="/affectation" className={lienClasse}>
          Affectation
        </NavLink>
        <NavLink to="/encaissement" className={lienClasse}>
          Encaissement
        </NavLink>
        <NavLink to="/historique" className={lienClasse}>
          Historique
        </NavLink>
      </div>
      <button
        onClick={logout}
        className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
      >
        Déconnexion
      </button>
    </nav>
  )
}
