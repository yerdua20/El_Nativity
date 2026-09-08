import { useState } from 'react'
import { listerClients, listerCommerciaux, listerProduits } from '../api/ressources'
import Layout from '../components/Layout'
import { useRessource } from '../hooks/useRessource'
import { mettreEnFile } from '../offline/sync'

export default function VenteDeclaree() {
  const clients = useRessource(listerClients, 'cache_clients')
  const commerciaux = useRessource(listerCommerciaux, 'cache_commerciaux')
  const produits = useRessource(listerProduits, 'cache_produits')

  const [clientId, setClientId] = useState('')
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
        type: 'VENTE_DECLAREE',
        produit: produitId,
        quantite,
        client: clientId,
        commercial: commercialId,
        date_mouvement: new Date().toISOString(),
      },
    })
    setSucces('Vente déclarée enregistrée (synchronisation en cours ou en attente de réseau).')
    setQuantite('')
    setEnCours(false)
  }

  return (
    <Layout>
        <h1 className="mb-6 text-xl font-semibold text-slate-900">Vente déclarée par un client</h1>
        <p className="mb-6 text-sm text-slate-500">
          Le client déclare avoir vendu une partie de la marchandise déposée : son solde marchandise
          diminue d'autant et son solde financier augmente (vente désormais reconnue).
        </p>

        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              required
            >
              <option value="" disabled>
                Client
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nom}
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
                Commercial
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
              placeholder="Quantité vendue"
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
            {enCours ? 'Enregistrement...' : 'Déclarer la vente'}
          </button>
        </form>
    </Layout>
  )
}
