import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useFileAttente } from '../offline/useFileAttente'

const lienClasse = ({ isActive }) =>
  `relative rounded px-3 py-1.5 text-sm whitespace-nowrap ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`

export default function Nav() {
  const { logout } = useAuth()
  const entrees = useFileAttente()
  const enAttente = entrees.filter((entree) => entree.statut === 'en_attente').length
  const echecs = entrees.filter((entree) => entree.statut === 'echec').length

  return (
    <nav className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-6 pt-6">
      <div className="flex flex-wrap gap-2">
        <NavLink to="/" end className={lienClasse}>
          Tableau de bord
        </NavLink>
        <NavLink to="/clients" className={lienClasse}>
          Clients
        </NavLink>
        <NavLink to="/commerciaux" className={lienClasse}>
          Commerciaux
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
        <NavLink to="/synchro" className={lienClasse}>
          Synchronisation
          {enAttente + echecs > 0 && (
            <span
              className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                echecs > 0 ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
              }`}
            >
              {enAttente + echecs}
            </span>
          )}
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
