import { useState } from 'react'
import { listerCommerciaux, listerPointsDeVente, listerProduits } from '../api/ressources'
import Nav from '../components/Nav'
import { useRessource } from '../hooks/useRessource'
import { mettreEnFile } from '../offline/sync'

export default function AffectationCommercial() {
  const commerciaux = useRessource(listerCommerciaux, 'cache_commerciaux')
  const produits = useRessource(listerProduits, 'cache_produits')
  const pointsDeVente = useRessource(listerPointsDeVente, 'cache_points_de_vente')

  const [pointDeVenteId, setPointDeVenteId] = useState('')
  const [commercialId, setCommercialId] = useState('')
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
        type: 'AFFECTATION_COMMERCIAL',
        produit: produitId,
        quantite,
        point_de_vente: pointDeVenteId,
        commercial: commercialId,
        date_mouvement: new Date().toISOString(),
      },
    })
    setSucces('Affectation enregistrée (synchronisation en cours ou en attente de réseau).')
    setQuantite('')
    setEnCours(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-6 text-xl font-semibold text-slate-900">Affectation à un commercial</h1>
        <p className="mb-6 text-sm text-slate-500">
          Sortie de marchandise du dépôt vers un commercial : augmente son solde marchandise.
        </p>

        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              value={pointDeVenteId}
              onChange={(event) => setPointDeVenteId(event.target.value)}
              required
            >
              <option value="" disabled>
                Dépôt source
              </option>
              {pointsDeVente.map((pdv) => (
                <option key={pdv.id} value={pdv.id}>
                  {pdv.nom}
                </option>
              ))}
            </select>

            <select
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              value={commercialId}
              onChange={(event) => setCommercialId(event.target.value)}
              required
            >
              <option value="" disabled>
                Commercial destinataire
              </option>
              {commerciaux.map((commercial) => (
                <option key={commercial.id} value={commercial.id}>
                  {commercial.prenom} {commercial.nom}
                </option>
              ))}
            </select>

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

            <input
              type="number"
              step="0.01"
              min="0.01"
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="Quantité"
              value={quantite}
              onChange={(event) => setQuantite(event.target.value)}
              required
            />
          </div>

          {succes && <p className="mb-3 text-sm text-green-600">{succes}</p>}

          <button
            type="submit"
            disabled={enCours}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {enCours ? 'Enregistrement...' : 'Affecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
