import { PackageCheck } from 'lucide-react'
import { useState } from 'react'
import { listerPointsDeVente, listerProduits } from '../api/ressources'
import EnTeteBandeau from '../components/EnTeteBandeau'
import Layout from '../components/Layout'
import { useRessource } from '../hooks/useRessource'
import { mettreEnFile } from '../offline/sync'

export default function ReceptionStock() {
  const pointsDeVente = useRessource(listerPointsDeVente, 'cache_points_de_vente')
  const produits = useRessource(listerProduits, 'cache_produits')

  const [pointDeVenteId, setPointDeVenteId] = useState('')
  const [produitId, setProduitId] = useState('')
  const [quantite, setQuantite] = useState('')
  const [succes, setSucces] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSucces('')
    setEnCours(true)
    await mettreEnFile({
      endpoint: '/mouvements-stock/',
      payload: {
        uuid: crypto.randomUUID(),
        type: 'ENTREE_DEPOT',
        produit: produitId,
        quantite,
        point_de_vente: pointDeVenteId,
        date_mouvement: new Date().toISOString(),
      },
    })
    setSucces('Réception enregistrée (synchronisation en cours ou en attente de réseau).')
    setQuantite('')
    setEnCours(false)
  }

  return (
    <Layout>
      <EnTeteBandeau
        titre="Réception de stock"
        sousTitre="Enregistrer une arrivée de marchandise à un point de vente"
        icone={PackageCheck}
      />
      <p className="mb-4 text-sm text-slate-500">
        Augmente le stock disponible du point de vente (dépôt, bar ou restaurant) pour ce produit.
      </p>

      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Point de vente</label>
            <select
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              value={pointDeVenteId}
              onChange={(event) => setPointDeVenteId(event.target.value)}
              required
            >
              <option value="" disabled>
                Choisir un point de vente
              </option>
              {pointsDeVente.map((pdv) => (
                <option key={pdv.id} value={pdv.id}>
                  {pdv.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Produit</label>
            <select
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              value={produitId}
              onChange={(event) => setProduitId(event.target.value)}
              required
            >
              <option value="" disabled>
                Choisir un produit
              </option>
              {produits.map((produit) => (
                <option key={produit.id} value={produit.id}>
                  {produit.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Quantité reçue</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              value={quantite}
              onChange={(event) => setQuantite(event.target.value)}
              required
            />
          </div>
        </div>

        {succes && <p className="mb-3 text-sm text-green-600">{succes}</p>}

        <button
          type="submit"
          disabled={enCours}
          className="rounded-2xl bg-or-500 px-4 py-2 text-sm font-medium text-white hover:bg-or-600 disabled:opacity-50"
        >
          {enCours ? 'Enregistrement...' : 'Enregistrer la réception'}
        </button>
      </form>
    </Layout>
  )
}
