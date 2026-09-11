import {
  BookOpen,
  Boxes,
  Briefcase,
  CalendarClock,
  CreditCard,
  History,
  Home,
  LogOut,
  MapPin,
  RefreshCw,
  Settings,
  ShoppingCart,
  Store,
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
  { to: '/marchands', label: 'Points de dépôt-vente', icon: Store },
  { to: '/carte', label: 'Carte', icon: MapPin },
  { to: '/commerciaux', label: 'Personnels', icon: Briefcase },
  { to: '/stock', label: 'Stock', icon: Boxes },
  { to: '/vente', label: 'Vente déclarée', icon: ShoppingCart },
  { to: '/vente-directe', label: 'Vente directe', icon: Store },
  { to: '/reservations', label: 'Réservations', icon: CalendarClock },
  { to: '/retours', label: 'Retours', icon: Undo2 },
  { to: '/encaissement', label: 'Encaissement', icon: CreditCard },
  { to: '/catalogue', label: 'Catalogue', icon: BookOpen },
  { to: '/historique', label: 'Historique', icon: History },
  { to: '/profil', label: 'Paramètres', icon: Settings },
]

const lienClasse = ({ isActive }) =>
  `relative flex items-center gap-3 rounded-md px-4 py-2.5 text-base font-medium transition ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
  }`

export default function Nav() {
  const { logout } = useAuth()
  const entrees = useFileAttente()
  const enAttente = entrees.filter((entree) => entree.statut === 'en_attente').length
  const echecs = entrees.filter((entree) => entree.statut === 'echec').length
  const total = enAttente + echecs

  return (
    <nav className="flex shrink-0 flex-col border-b border-slate-200 bg-white px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-r lg:border-b-0">
      <div className="shrink-0">
        <div className="mb-4 hidden items-center gap-3 px-2 lg:flex">
          <img src={logoNativite} alt="" className="h-16 w-16 rounded-full" />
          <div>
            <span className="block text-base leading-tight font-semibold text-slate-900">Espace de gestion</span>
          </div>
        </div>

        <button
          onClick={synchroniser}
          className="relative mb-4 flex w-full items-center gap-3 rounded-2xl border border-green-300 bg-green-50 px-4 py-2.5 text-base font-medium text-green-800 hover:bg-green-100"
        >
          <RefreshCw className="h-5 w-5 shrink-0" />
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
      </div>

      <div className="flex flex-wrap gap-1 lg:min-h-0 lg:flex-1 lg:flex-col lg:flex-nowrap lg:gap-1 lg:overflow-y-auto">
        {LIENS.map((lien) => (
          <NavLink key={lien.to} to={lien.to} end={lien.end} className={lienClasse}>
            <lien.icon className="h-5 w-5 shrink-0" />
            {lien.label}
          </NavLink>
        ))}
      </div>

      <button
        onClick={logout}
        className="mt-4 flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-base text-slate-700 hover:bg-or-50 focus:outline-none focus:ring-2 focus:ring-or-400 focus:ring-offset-2"
      >
        <LogOut className="h-5 w-5" />
        Déconnexion
      </button>
    </nav>
  )
}
