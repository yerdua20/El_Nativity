import { BookOpen, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  creerPointDeVente,
  creerProduit,
  creerTarif,
  listerPointsDeVente,
  listerProduits,
  listerTarifs,
} from '../api/ressources'
import EnTeteBandeau from '../components/EnTeteBandeau'
import Layout from '../components/Layout'

const TYPES_PDV = [
  { valeur: 'DEPOT', libelle: 'Dépôt' },
  { valeur: 'BAR', libelle: 'Bar' },
  { valeur: 'RESTAURANT', libelle: 'Restaurant' },
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function SectionProduits({ produits, rafraichir }) {
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [nom, setNom] = useState('')
  const [reference, setReference] = useState('')
  const [unite, setUnite] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  const produitsFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase()
    if (!terme) return produits
    return produits.filter((p) => p.nom.toLowerCase().includes(terme) || p.reference.toLowerCase().includes(terme))
  }, [produits, recherche])

  async function handleSubmit(event) {
    event.preventDefault()
    setErreur('')
    setEnCours(true)
    try {
      await creerProduit({ nom, reference, unite })
      setNom('')
      setReference('')
      setUnite('')
      setFormulaireOuvert(false)
      rafraichir()
    } catch {
      setErreur('Impossible de créer ce produit (référence déjà utilisée ?).')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="mb-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded border border-slate-300 py-2 pr-3 pl-9 text-sm focus:border-or-400 focus:outline-none"
            placeholder="Rechercher un produit..."
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
          />
        </div>
        <button
          onClick={() => setFormulaireOuvert((v) => !v)}
          className="flex items-center gap-1.5 rounded bg-or-500 px-3 py-2 text-sm font-medium text-white hover:bg-or-600"
        >
          <Plus className="h-4 w-4" />
          Nouveau produit
        </button>
      </div>

      {formulaireOuvert && (
        <form onSubmit={handleSubmit} className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-4">
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
            placeholder="Nom"
            value={nom}
            onChange={(event) => setNom(event.target.value)}
            required
          />
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
            placeholder="Référence"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            required
          />
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
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
          {erreur && <p className="text-sm text-red-600 sm:col-span-4">{erreur}</p>}
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {produitsFiltres.length === 0 && <p className="p-4 text-sm text-slate-500">Aucun produit trouvé.</p>}
        {produitsFiltres.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="px-4 py-3 font-medium">Référence</th>
                <th className="px-4 py-3 font-medium">Unité</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {produitsFiltres.map((produit) => (
                <tr key={produit.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-or-100 text-or-600">
                        <BookOpen className="h-4 w-4" />
                      </span>
                      {produit.nom}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{produit.reference}</td>
                  <td className="px-4 py-3 text-slate-500">{produit.unite}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        produit.actif ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {produit.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
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
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
          placeholder="Nom"
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          required
        />
        <select
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
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
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
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
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
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
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
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
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
          placeholder="Prix"
          value={prix}
          onChange={(event) => setPrix(event.target.value)}
          required
        />
        <input
          type="date"
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
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
    <Layout>
      <EnTeteBandeau titre="Catalogue" sousTitre="Consultez et gérez vos produits" icone={BookOpen} />
      <p className="mb-6 text-sm text-slate-500">
        Réservé au staff : les commerciaux terrain peuvent consulter mais pas modifier. Les prix
        sont gérés séparément dans la section Tarifs (par point de vente et date d'effet).
      </p>
      <SectionProduits produits={produits} rafraichir={rafraichir} />
      <SectionPointsDeVente pointsDeVente={pointsDeVente} rafraichir={rafraichir} />
      <SectionTarifs tarifs={tarifs} produits={produits} pointsDeVente={pointsDeVente} rafraichir={rafraichir} />
    </Layout>
  )
}
