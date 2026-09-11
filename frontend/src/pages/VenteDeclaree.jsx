import { ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { listerClients, listerCommerciaux, listerProduits } from '../api/ressources'
import EnTeteBandeau from '../components/EnTeteBandeau'
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
      <EnTeteBandeau
        titre="Vente déclarée"
        sousTitre="Enregistrer une vente effectuée par un client"
        icone={ShoppingCart}
      />
      <p className="mb-4 text-sm text-slate-500">
        Le solde marchandise du client diminue d'autant et son solde financier augmente (vente
        désormais reconnue).
      </p>

      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Client</label>
            <select
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              required
            >
              <option value="" disabled>
                Choisir un client
              </option>
              {clients.filter((client) => client.mode_vente !== 'CASH').map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Commercial</label>
            <select
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              value={commercialId}
              onChange={(event) => setCommercialId(event.target.value)}
              required
            >
              <option value="" disabled>
                Choisir un commercial
              </option>
              {commerciaux.map((commercial) => (
                <option key={commercial.id} value={commercial.id}>
                  {commercial.prenom} {commercial.nom}
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
            <label className="mb-1 block text-sm font-medium text-slate-700">Quantité vendue</label>
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
          {enCours ? 'Enregistrement...' : 'Déclarer la vente'}
        </button>
      </form>
    </Layout>
  )
}
