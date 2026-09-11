import {
  Briefcase,
  Clock,
  CreditCard,
  FileText,
  History,
  Home,
  Package,
  ShoppingCart,
  Store,
  TrendingUp,
  Undo2,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  listerClients,
  listerCommerciaux,
  listerMouvements,
  listerPointsDeVente,
  listerProduits,
} from '../api/ressources'
import Layout from '../components/Layout'

const ACTIONS_RAPIDES = [
  { to: '/marchands', titre: 'Marchands', description: 'Voir la liste et les soldes, déposer de la marchandise', icon: Store },
  { to: '/vente', titre: 'Vente déclarée', description: 'Enregistrer la vente déclarée par un marchand', icon: ShoppingCart },
  { to: '/encaissement', titre: 'Encaissement', description: "Enregistrer un paiement d'un marchand", icon: CreditCard },
  { to: '/retours', titre: 'Retours', description: 'Retour de marchandise invendue vers le dépôt', icon: Undo2 },
  { to: '/clients', titre: 'Clients', description: 'Clients qui commandent et paient comptant', icon: Users },
  { to: '/historique', titre: 'Historique', description: 'Mouvements et encaissements récents', icon: History },
]

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
  DEPOT_CLIENT: 'Dépôt marchand',
  VENTE_DECLAREE: 'Vente déclarée',
  RETOUR_CLIENT: 'Retour marchand',
  VENTE_DIRECTE: 'Vente directe',
  PERTE: 'Perte',
}

function Badge({ icon: Icon, tonalite }) {
  const classes = tonalite === 'or' ? 'bg-or-100 text-or-600' : 'bg-slate-100 text-slate-600'
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${classes}`}>
      <Icon className="h-5 w-5" />
    </span>
  )
}

function StatTile({ label, value, icon, tonalite }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <Badge icon={icon} tonalite={tonalite} />
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold text-slate-900">{value}</p>
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

function GraphiqueBarres({ titre, donnees, hex, tonalite }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-4 flex items-center gap-2.5 text-sm font-semibold text-slate-700">
        <Badge icon={TrendingUp} tonalite={tonalite} />
        {titre}
      </h2>
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
  const [clients, setClients] = useState(null)
  const [commerciaux, setCommerciaux] = useState(null)
  const [mouvements, setMouvements] = useState(null)
  const [produits, setProduits] = useState([])
  const [pointsDeVente, setPointsDeVente] = useState([])
  const [ventesJour, setVentesJour] = useState(null)

  function charger() {
    listerClients().then(setClients)
    listerCommerciaux().then(setCommerciaux)
    listerMouvements().then((data) => setMouvements(data.results))
    listerProduits().then(setProduits)
    listerPointsDeVente().then(setPointsDeVente)
    const debutJour = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
    listerMouvements(`/mouvements-stock/?depuis=${encodeURIComponent(debutJour)}`).then((data) =>
      setVentesJour(data.results),
    )
  }

  useEffect(charger, [])

  const nomsProduits = Object.fromEntries(produits.map((p) => [p.id, p.nom]))
  const nomsPdv = Object.fromEntries(pointsDeVente.map((p) => [p.id, p.nom]))

  const resumeVentesDirectesJour = Object.values(
    (ventesJour ?? [])
      .filter((m) => m.type === 'VENTE_DIRECTE')
      .reduce((acc, m) => {
        const cle = `${m.point_de_vente}-${m.produit}`
        if (!acc[cle]) {
          acc[cle] = { pointDeVente: m.point_de_vente, produit: m.produit, quantite: 0, montant: 0 }
        }
        acc[cle].quantite += Number(m.quantite)
        acc[cle].montant += Number(m.montant ?? 0)
        return acc
      }, {}),
  ).sort((a, b) => (nomsPdv[a.pointDeVente] ?? '').localeCompare(nomsPdv[b.pointDeVente] ?? ''))

  const marchands = clients?.filter((c) => c.mode_vente === 'DEPOT_VENTE')
  const soldeMarchandiseTotal = marchands?.reduce((total, c) => total + Number(c.solde_marchandise), 0)
  const creancesTotal = marchands?.reduce((total, c) => total + Number(c.solde_financier), 0)
  const commerciauxActifs = commerciaux?.filter((c) => c.actif).length

  const topMarchandise =
    marchands
      ?.filter((c) => Number(c.solde_marchandise) > 0)
      .sort((a, b) => Number(b.solde_marchandise) - Number(a.solde_marchandise))
      .slice(0, 5)
      .map((c) => ({ nom: c.nom, valeur: Number(c.solde_marchandise) })) ?? []

  const topCreances =
    marchands
      ?.filter((c) => Number(c.solde_financier) > 0)
      .sort((a, b) => Number(b.solde_financier) - Number(a.solde_financier))
      .slice(0, 5)
      .map((c) => ({ nom: c.nom, valeur: Number(c.solde_financier) })) ?? []

  return (
    <Layout>
      <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 px-6 py-8 text-white shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(206,154,46,0.35)_1.5px,transparent_1.5px)] bg-[length:22px_22px]" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(206,154,46,0.08)_0px,rgba(206,154,46,0.08)_2px,transparent_2px,transparent_18px)]" />
        <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full border-2 border-or-400/25" />
        <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-or-400/10" />
        <div className="absolute top-1/2 left-1/3 h-20 w-20 -translate-y-1/2 rounded-full border border-white/10" />
        <div className="absolute -bottom-20 left-1/4 h-28 w-28 rounded-full bg-white/5" />
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full border-2 border-or-400/30" />
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-or-400/15" />
        <div className="absolute -bottom-16 -right-24 h-56 w-56 rounded-full border-2 border-or-400/20" />
        <div className="absolute -bottom-16 -right-24 h-56 w-56 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-20 w-12 shrink-0 items-center justify-center rounded-full bg-transparent">
            <Home className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Tableau de bord</h1>
            <p className="text-sm text-neutral-300">Vue d'ensemble de votre activité</p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Marchands" value={marchands ? marchands.length : '…'} icon={Users} tonalite="or" />
        <StatTile
          label="Commerciaux actifs"
          value={commerciaux ? commerciauxActifs : '…'}
          icon={Briefcase}
          tonalite="neutre"
        />
        <StatTile
          label="Marchandise en cours"
          value={marchands ? formaterMontant(soldeMarchandiseTotal) : '…'}
          icon={Package}
          tonalite="or"
        />
        <StatTile
          label="Créances marchands"
          value={marchands ? formaterMontant(creancesTotal) : '…'}
          icon={FileText}
          tonalite="neutre"
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GraphiqueBarres titre="Marchandise par marchand" donnees={topMarchandise} hex="#ce9a2e" tonalite="or" />
        <GraphiqueBarres titre="Plus grosses créances marchands" donnees={topCreances} hex="#52525b" tonalite="neutre" />
      </div>

      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 flex items-center gap-2.5 text-sm font-semibold text-slate-700">
          <Badge icon={Store} tonalite="or" />
          Ventes directes aujourd'hui (bars, restaurant)
        </h2>
        {!ventesJour && <p className="text-sm text-slate-400">Chargement...</p>}
        {ventesJour && resumeVentesDirectesJour.length === 0 && (
          <p className="text-sm text-slate-400">Aucune vente directe enregistrée aujourd'hui.</p>
        )}
        {resumeVentesDirectesJour.length > 0 && (
          <ul className="divide-y divide-slate-100 text-sm">
            {resumeVentesDirectesJour.map((ligne) => (
              <li key={`${ligne.pointDeVente}-${ligne.produit}`} className="flex items-center justify-between py-2.5">
                <span className="text-slate-800">
                  {nomsPdv[ligne.pointDeVente] ?? ligne.pointDeVente} —{' '}
                  {nomsProduits[ligne.produit] ?? ligne.produit}
                </span>
                <span className="text-slate-500">
                  {ligne.quantite} vendu{ligne.quantite > 1 ? 's' : ''} · {formaterMontant(ligne.montant)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 flex items-center gap-2.5 text-sm font-semibold text-slate-700">
          <Badge icon={Clock} tonalite="or" />
          Activité récente
        </h2>
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
        {ACTIONS_RAPIDES.map((action, index) => (
          <Link
            key={action.to}
            to={action.to}
            className="group relative flex items-center gap-3 overflow-hidden rounded-lg border border-slate-200 bg-white p-4 transition hover:border-or-300 hover:shadow-sm"
          >
            <span className="absolute inset-y-0 left-0 w-1 scale-y-0 bg-or-400 transition-transform group-hover:scale-y-100" />
            <Badge icon={action.icon} tonalite={index % 2 === 0 ? 'or' : 'neutre'} />
            <div>
              <p className="font-medium text-slate-900">{action.titre}</p>
              <p className="mt-0.5 text-sm text-slate-500">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  )
}
