import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import apiClient from '../api/client'
import { listerClients, listerCommerciaux, listerMouvements, listerProduits } from '../api/ressources'
import logoNativite from '../assets/logo-nativite.png'
import Layout from '../components/Layout'

const ACTIONS_RAPIDES = [
  { to: '/depot', titre: 'Nouveau dépôt', description: 'Déposer de la marchandise chez un client' },
  { to: '/vente', titre: 'Vente déclarée', description: "Enregistrer la vente déclarée par un client" },
  { to: '/encaissement', titre: 'Encaissement', description: "Enregistrer un paiement d'un client" },
  { to: '/retours', titre: 'Retours', description: 'Retour client ou retour au dépôt' },
  { to: '/clients', titre: 'Clients', description: 'Voir la liste et les soldes des clients' },
  { to: '/historique', titre: 'Historique', description: 'Mouvements et encaissements récents' },
]

const FORMATTEUR_DATE = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

function formaterMontant(valeur) {
  return Number(valeur).toLocaleString('fr-FR')
}

function tempsRelatif(dateIso) {
  const secondes = Math.round((Date.now() - new Date(dateIso).getTime()) / 1000)
  if (secondes < 60) return "à l'instant"
  const minutes = Math.round(secondes / 60)
  if (minutes < 60) return `il y a ${minutes} min`
  const heures = Math.round(minutes / 60)
  if (heures < 24) return `il y a ${heures} h`
  const jours = Math.round(heures / 24)
  if (jours === 1) return 'hier'
  return `il y a ${jours} j`
}

const LIBELLES_TYPE = {
  ENTREE_DEPOT: 'Entrée dépôt',
  AFFECTATION_COMMERCIAL: 'Affectation',
  DEPOT_CLIENT: 'Dépôt client',
  VENTE_DECLAREE: 'Vente déclarée',
  RETOUR_CLIENT: 'Retour client',
  RETOUR_DEPOT: 'Retour dépôt',
  VENTE_DIRECTE: 'Vente directe',
  PERTE: 'Perte',
}

function StatTile({ label, value, accent }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className={`h-1 ${accent}`} />
      <div className="p-4">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function BulleInfo({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-slate-900">{label}</p>
      <p className="text-slate-600">{formaterMontant(payload[0].value)}</p>
    </div>
  )
}

function GraphiqueBarres({ titre, donnees, hex }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">{titre}</h2>
      {donnees.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">Pas encore de données.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(donnees.length * 44, 60)}>
          <BarChart data={donnees} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }}>
            <CartesianGrid horizontal={false} stroke="#e1e0d9" />
            <XAxis type="number" tick={{ fontSize: 12, fill: '#898781' }} axisLine={{ stroke: '#c3c2b7' }} tickLine={false} />
            <YAxis
              type="category"
              dataKey="nom"
              width={110}
              tick={{ fontSize: 13, fill: '#0b0b0b' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<BulleInfo />} cursor={{ fill: '#f9f9f7' }} />
            <Bar dataKey="valeur" fill={hex} radius={[0, 4, 4, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [sante, setSante] = useState('...')
  const [clients, setClients] = useState(null)
  const [commerciaux, setCommerciaux] = useState(null)
  const [mouvements, setMouvements] = useState(null)
  const [produits, setProduits] = useState([])

  useEffect(() => {
    apiClient
      .get('/sante/')
      .then(({ data }) => setSante(data.status))
      .catch(() => setSante('indisponible'))
    listerClients().then(setClients)
    listerCommerciaux().then(setCommerciaux)
    listerMouvements().then((data) => setMouvements(data.results))
    listerProduits().then(setProduits)
  }, [])

  const nomsProduits = Object.fromEntries(produits.map((p) => [p.id, p.nom]))

  const soldeMarchandiseTotal = clients?.reduce((total, c) => total + Number(c.solde_marchandise), 0)
  const creancesTotal = clients?.reduce((total, c) => total + Number(c.solde_financier), 0)
  const commerciauxActifs = commerciaux?.filter((c) => c.actif).length

  const topCommerciaux =
    commerciaux
      ?.filter((c) => Number(c.solde_marchandise) > 0)
      .sort((a, b) => Number(b.solde_marchandise) - Number(a.solde_marchandise))
      .slice(0, 5)
      .map((c) => ({ nom: `${c.prenom} ${c.nom}`, valeur: Number(c.solde_marchandise) })) ?? []

  const topCreances =
    clients
      ?.filter((c) => Number(c.solde_financier) > 0)
      .sort((a, b) => Number(b.solde_financier) - Number(a.solde_financier))
      .slice(0, 5)
      .map((c) => ({ nom: c.nom, valeur: Number(c.solde_financier) })) ?? []

  return (
    <Layout>
        <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-br from-vert-600 to-vert-800 px-6 py-8 text-white shadow-sm">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-or-400/20" />
          <div className="absolute -bottom-16 -right-24 h-56 w-56 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <img src={logoNativite} alt="" className="h-14 w-14 rounded-full ring-2 ring-white/40" />
            <div>
              <p className="text-sm text-vert-100 capitalize">{FORMATTEUR_DATE.format(new Date())}</p>
              <h1 className="text-2xl font-semibold">La Nativité — Gestion</h1>
            </div>
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs">
              <span className={`h-1.5 w-1.5 rounded-full ${sante === 'ok' ? 'bg-or-300' : 'bg-red-400'}`} />
              API {sante === 'ok' ? 'connectée' : sante}
            </span>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Clients" value={clients ? clients.length : '…'} accent="bg-or-400" />
          <StatTile
            label="Commerciaux actifs"
            value={commerciaux ? commerciauxActifs : '…'}
            accent="bg-vert-400"
          />
          <StatTile
            label="Marchandise en cours"
            value={clients ? formaterMontant(soldeMarchandiseTotal) : '…'}
            accent="bg-or-400"
          />
          <StatTile
            label="Créances clients"
            value={clients ? formaterMontant(creancesTotal) : '…'}
            accent="bg-vert-400"
          />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <GraphiqueBarres titre="Marchandise par commercial" donnees={topCommerciaux} hex="#ce9a2e" />
          <GraphiqueBarres titre="Plus grosses créances clients" donnees={topCreances} hex="#2e7359" />
        </div>

        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Activité récente</h2>
          {!mouvements && <p className="text-sm text-slate-400">Chargement...</p>}
          {mouvements?.length === 0 && <p className="text-sm text-slate-400">Aucun mouvement pour l'instant.</p>}
          {mouvements && mouvements.length > 0 && (
            <ul className="divide-y divide-slate-100 text-sm">
              {mouvements.slice(0, 6).map((mouvement) => (
                <li key={mouvement.id} className="flex items-center gap-3 py-2.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-or-400" />
                  <span className="flex-1 text-slate-800">
                    {LIBELLES_TYPE[mouvement.type] ?? mouvement.type} —{' '}
                    {nomsProduits[mouvement.produit] ?? mouvement.produit} × {mouvement.quantite}
                  </span>
                  <span className="shrink-0 text-slate-400">{tempsRelatif(mouvement.date_mouvement)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <h2 className="mb-3 text-sm font-semibold text-slate-700">Actions rapides</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ACTIONS_RAPIDES.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-4 transition hover:border-vert-300 hover:shadow-sm"
            >
              <span className="absolute inset-y-0 left-0 w-1 scale-y-0 bg-or-400 transition-transform group-hover:scale-y-100" />
              <p className="font-medium text-slate-900">{action.titre}</p>
              <p className="mt-1 text-sm text-slate-500">{action.description}</p>
            </Link>
          ))}
        </div>
    </Layout>
  )
}
