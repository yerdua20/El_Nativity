import { useEffect, useState } from 'react'
import {
  creerPointDeVente,
  creerProduit,
  creerTarif,
  listerPointsDeVente,
  listerProduits,
  listerTarifs,
} from '../api/ressources'
import Nav from '../components/Nav'

const TYPES_PDV = [
  { valeur: 'DEPOT', libelle: 'Dépôt' },
  { valeur: 'BAR', libelle: 'Bar' },
  { valeur: 'RESTAURANT', libelle: 'Restaurant' },
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function SectionPointsDeVente({ pointsDeVente, rafraichir }) {
  const [nom, setNom] = useState('')
  const [typePdv, setTypePdv] = useState('DEPOT')
  const [adresse, setAdresse] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setEnCours(true)
    await creerPointDeVente({ nom, type_pdv: typePdv, adresse })
    setNom('')
    setAdresse('')
    setEnCours(false)
    rafraichir()
  }

  return (
    <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Points de vente</h2>
      <form onSubmit={handleSubmit} className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <input
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          placeholder="Nom"
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          required
        />
        <select
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          value={typePdv}
          onChange={(event) => setTypePdv(event.target.value)}
        >
          {TYPES_PDV.map((type) => (
            <option key={type.valeur} value={type.valeur}>
              {type.libelle}
            </option>
          ))}
        </select>
        <input
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          placeholder="Adresse"
          value={adresse}
          onChange={(event) => setAdresse(event.target.value)}
        />
        <button
          type="submit"
          disabled={enCours}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Créer
        </button>
      </form>
      <ul className="divide-y divide-slate-100 text-sm">
        {pointsDeVente.map((pdv) => (
          <li key={pdv.id} className="py-2">
            {pdv.nom} <span className="text-slate-500">({pdv.type_pdv})</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SectionProduits({ produits, rafraichir }) {
  const [nom, setNom] = useState('')
  const [reference, setReference] = useState('')
  const [unite, setUnite] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setErreur('')
    setEnCours(true)
    try {
      await creerProduit({ nom, reference, unite })
      setNom('')
      setReference('')
      setUnite('')
      rafraichir()
    } catch {
      setErreur('Impossible de créer ce produit (référence déjà utilisée ?).')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Produits</h2>
      <form onSubmit={handleSubmit} className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <input
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          placeholder="Nom"
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          required
        />
        <input
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          placeholder="Référence"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          required
        />
        <input
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          placeholder="Unité (casier, litre...)"
          value={unite}
          onChange={(event) => setUnite(event.target.value)}
          required
        />
        <button
          type="submit"
          disabled={enCours}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Créer
        </button>
      </form>
      {erreur && <p className="mb-3 text-sm text-red-600">{erreur}</p>}
      <ul className="divide-y divide-slate-100 text-sm">
        {produits.map((produit) => (
          <li key={produit.id} className="py-2">
            {produit.nom} <span className="text-slate-500">({produit.reference})</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SectionTarifs({ tarifs, produits, pointsDeVente, rafraichir }) {
  const [produitId, setProduitId] = useState('')
  const [pointDeVenteId, setPointDeVenteId] = useState('')
  const [prix, setPrix] = useState('')
  const [dateEffet, setDateEffet] = useState(todayISO())
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  const nomsProduits = Object.fromEntries(produits.map((p) => [p.id, p.nom]))
  const nomsPdv = Object.fromEntries(pointsDeVente.map((p) => [p.id, p.nom]))

  async function handleSubmit(event) {
    event.preventDefault()
    setErreur('')
    setEnCours(true)
    try {
      await creerTarif({
        produit: Number(produitId),
        point_de_vente: Number(pointDeVenteId),
        prix,
        date_effet: dateEffet,
      })
      setPrix('')
      rafraichir()
    } catch {
      setErreur('Impossible de créer ce tarif (déjà un tarif pour ce produit/point de vente/date ?).')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Tarifs</h2>
      <form onSubmit={handleSubmit} className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-5">
        <select
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          value={produitId}
          onChange={(event) => setProduitId(event.target.value)}
          required
        >
          <option value="" disabled>
            Produit
          </option>
          {produits.map((produit) => (
            <option key={produit.id} value={produit.id}>
              {produit.nom}
            </option>
          ))}
        </select>
        <select
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          value={pointDeVenteId}
          onChange={(event) => setPointDeVenteId(event.target.value)}
          required
        >
          <option value="" disabled>
            Point de vente
          </option>
          {pointsDeVente.map((pdv) => (
            <option key={pdv.id} value={pdv.id}>
              {pdv.nom}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          min="0"
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          placeholder="Prix"
          value={prix}
          onChange={(event) => setPrix(event.target.value)}
          required
        />
        <input
          type="date"
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          value={dateEffet}
          onChange={(event) => setDateEffet(event.target.value)}
          required
        />
        <button
          type="submit"
          disabled={enCours}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Créer
        </button>
      </form>
      {erreur && <p className="mb-3 text-sm text-red-600">{erreur}</p>}
      <ul className="divide-y divide-slate-100 text-sm">
        {tarifs.map((tarif) => (
          <li key={tarif.id} className="flex justify-between py-2">
            <span>
              {nomsProduits[tarif.produit] ?? tarif.produit} @ {nomsPdv[tarif.point_de_vente] ?? tarif.point_de_vente}
            </span>
            <span className="text-slate-500">
              {tarif.prix} (dès le {tarif.date_effet})
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Catalogue() {
  const [pointsDeVente, setPointsDeVente] = useState([])
  const [produits, setProduits] = useState([])
  const [tarifs, setTarifs] = useState([])

  function rafraichir() {
    listerPointsDeVente().then(setPointsDeVente)
    listerProduits().then(setProduits)
    listerTarifs().then(setTarifs)
  }

  useEffect(rafraichir, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-6 text-xl font-semibold text-slate-900">Catalogue</h1>
        <p className="mb-6 text-sm text-slate-500">
          Réservé au staff : les commerciaux terrain peuvent consulter mais pas modifier.
        </p>
        <SectionPointsDeVente pointsDeVente={pointsDeVente} rafraichir={rafraichir} />
        <SectionProduits produits={produits} rafraichir={rafraichir} />
        <SectionTarifs
          tarifs={tarifs}
          produits={produits}
          pointsDeVente={pointsDeVente}
          rafraichir={rafraichir}
        />
      </div>
    </div>
  )
}
