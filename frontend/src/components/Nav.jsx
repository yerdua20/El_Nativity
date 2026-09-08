import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const lienClasse = ({ isActive }) =>
  `rounded px-3 py-1.5 text-sm ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`

export default function Nav() {
  const { logout } = useAuth()

  return (
    <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 pt-6">
      <div className="flex gap-2">
        <NavLink to="/" end className={lienClasse}>
          Tableau de bord
        </NavLink>
        <NavLink to="/clients" className={lienClasse}>
          Clients
        </NavLink>
        <NavLink to="/depot" className={lienClasse}>
          Nouveau dépôt
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
