import {
  ArrowLeftRight,
  BookOpen,
  Briefcase,
  CreditCard,
  History,
  Home,
  LogOut,
  PackagePlus,
  RefreshCw,
  Settings,
  ShoppingCart,
  Undo2,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import logoNativite from '../assets/logo-nativite.png'
import { useAuth } from '../auth/AuthContext'
import { synchroniser } from '../offline/sync'
import { useFileAttente } from '../offline/useFileAttente'

const LIENS = [
  { to: '/', label: 'Tableau de bord', end: true, icon: Home },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/commerciaux', label: 'Commerciaux', icon: Briefcase },
  { to: '/depot', label: 'Nouveau dépôt', icon: PackagePlus },
  { to: '/vente', label: 'Vente déclarée', icon: ShoppingCart },
  { to: '/retours', label: 'Retours', icon: Undo2 },
  { to: '/affectation', label: 'Affectation', icon: ArrowLeftRight },
  { to: '/encaissement', label: 'Encaissement', icon: CreditCard },
  { to: '/historique', label: 'Historique', icon: History },
  { to: '/catalogue', label: 'Catalogue', icon: BookOpen },
  { to: '/profil', label: 'Paramètres', icon: Settings },
]

const lienClasse = ({ isActive }) =>
  `relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
  }`

export default function Nav() {
  const { logout } = useAuth()
  const entrees = useFileAttente()
  const enAttente = entrees.filter((entree) => entree.statut === 'en_attente').length
  const echecs = entrees.filter((entree) => entree.statut === 'echec').length
  const total = enAttente + echecs

  return (
    <nav className="flex shrink-0 flex-col justify-between border-b border-slate-200 bg-white px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-r lg:border-b-0">
      <div>
        <div className="mb-4 hidden items-center gap-3 px-2 lg:flex">
          <img src={logoNativite} alt="" className="h-14 w-14 rounded-full" />
          <div>
            <span className="block text-sm leading-tight font-semibold text-slate-900">Espace de gestion</span>
          </div>
        </div>

        <button
          onClick={synchroniser}
          className="relative mb-4 flex w-full items-center gap-2.5 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-800 hover:bg-green-100"
        >
          <RefreshCw className="h-4 w-4 shrink-0" />
          Synchroniser
          {total > 0 && (
            <span
              className={`ml-auto rounded-full px-1.5 py-0.5 text-xs ${
                echecs > 0 ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
              }`}
            >
              {total}
            </span>
          )}
        </button>

        <div className="flex flex-wrap gap-1 lg:flex-col lg:flex-nowrap lg:gap-1">
          {LIENS.map((lien) => (
            <NavLink key={lien.to} to={lien.to} end={lien.end} className={lienClasse}>
              <lien.icon className="h-4 w-4 shrink-0" />
              {lien.label}
            </NavLink>
          ))}
        </div>
      </div>
      <button
        onClick={logout}
        className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-or-50 focus:outline-none focus:ring-2 focus:ring-or-400 focus:ring-offset-2"
      >
        <LogOut className="h-4 w-4" />
        Déconnexion
      </button>
    </nav>
  )
}
