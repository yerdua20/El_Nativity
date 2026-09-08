import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import logoNativite from '../assets/logo-nativite.png'
import { useFileAttente } from '../offline/useFileAttente'

const LIENS = [
  { to: '/', label: 'Tableau de bord', end: true },
  { to: '/clients', label: 'Clients' },
  { to: '/commerciaux', label: 'Commerciaux' },
  { to: '/depot', label: 'Nouveau dépôt' },
  { to: '/vente', label: 'Vente déclarée' },
  { to: '/retours', label: 'Retours' },
  { to: '/affectation', label: 'Affectation' },
  { to: '/encaissement', label: 'Encaissement' },
  { to: '/historique', label: 'Historique' },
  { to: '/catalogue', label: 'Catalogue' },
  { to: '/synchro', label: 'Synchronisation' },
]

const lienClasse = ({ isActive }) =>
  `relative flex items-center rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
  }`

export default function Nav() {
  const { logout } = useAuth()
  const entrees = useFileAttente()
  const enAttente = entrees.filter((entree) => entree.statut === 'en_attente').length
  const echecs = entrees.filter((entree) => entree.statut === 'echec').length

  return (
    <nav className="flex shrink-0 flex-col justify-between border-b border-slate-200 bg-white px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-r lg:border-b-0">
      <div>
        <div className="mb-6 hidden flex-col items-center gap-2 px-2 text-center lg:flex">
          <img src={logoNativite} alt="" className="h-24 w-24 rounded-full" />
          <div>
            <span className="block text-lg leading-tight font-semibold text-slate-900">La Nativité</span>
            <span className="block text-xs text-slate-500">Gestion</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 lg:flex-col lg:flex-nowrap lg:gap-1">
          {LIENS.map((lien) => (
            <NavLink key={lien.to} to={lien.to} end={lien.end} className={lienClasse}>
              {lien.label}
              {lien.to === '/synchro' && enAttente + echecs > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                    echecs > 0 ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                  }`}
                >
                  {enAttente + echecs}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </div>
      <button
        onClick={logout}
        className="mt-4 rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
      >
        Déconnexion
      </button>
    </nav>
  )
}
