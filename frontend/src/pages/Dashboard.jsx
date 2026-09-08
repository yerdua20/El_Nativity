import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import { listerClients, listerCommerciaux } from '../api/ressources'
import Nav from '../components/Nav'

const ACTIONS_RAPIDES = [
  { to: '/depot', titre: 'Nouveau dépôt', description: 'Déposer de la marchandise chez un client' },
  { to: '/vente', titre: 'Vente déclarée', description: "Enregistrer la vente déclarée par un client" },
  { to: '/encaissement', titre: 'Encaissement', description: "Enregistrer un paiement d'un client" },
  { to: '/retours', titre: 'Retours', description: 'Retour client ou retour au dépôt' },
  { to: '/clients', titre: 'Clients', description: 'Voir la liste et les soldes des clients' },
  { to: '/historique', titre: 'Historique', description: 'Mouvements et encaissements récents' },
]

function CarteStat({ libelle, valeur }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{libelle}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{valeur}</p>
    </div>
  )
}

export default function Dashboard() {
  const [sante, setSante] = useState('...')
  const [clients, setClients] = useState(null)
  const [commerciaux, setCommerciaux] = useState(null)

  useEffect(() => {
    apiClient
      .get('/sante/')
      .then(({ data }) => setSante(data.status))
      .catch(() => setSante('indisponible'))
    listerClients().then(setClients)
    listerCommerciaux().then(setCommerciaux)
  }, [])

  const soldeMarchandiseTotal = clients?.reduce((total, c) => total + Number(c.solde_marchandise), 0)
  const creancesTotal = clients?.reduce((total, c) => total + Number(c.solde_financier), 0)
  const commerciauxActifs = commerciaux?.filter((c) => c.actif).length

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Tableau de bord</h1>
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span
              className={`h-1.5 w-1.5 rounded-full ${sante === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}
            />
            API {sante === 'ok' ? 'connectée' : sante}
          </span>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <CarteStat libelle="Clients" valeur={clients ? clients.length : '…'} />
          <CarteStat libelle="Commerciaux actifs" valeur={commerciaux ? commerciauxActifs : '…'} />
          <CarteStat
            libelle="Marchandise en cours"
            valeur={clients ? soldeMarchandiseTotal.toLocaleString('fr-FR') : '…'}
          />
          <CarteStat
            libelle="Créances clients"
            valeur={clients ? creancesTotal.toLocaleString('fr-FR') : '…'}
          />
        </div>

        <h2 className="mb-3 text-sm font-semibold text-slate-700">Actions rapides</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ACTIONS_RAPIDES.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-400 hover:shadow-sm"
            >
              <p className="font-medium text-slate-900">{action.titre}</p>
              <p className="mt-1 text-sm text-slate-500">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
