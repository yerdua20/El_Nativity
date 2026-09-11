import { Store } from 'lucide-react'
import { useMemo, useState } from 'react'
import { listerClients, listerPointsDeVente, listerProduits } from '../api/ressources'
import EnTeteBandeau from '../components/EnTeteBandeau'
import Layout from '../components/Layout'
import { useRessource } from '../hooks/useRessource'
import { mettreEnFile } from '../offline/sync'

export default function VenteDirecte() {
  const pointsDeVente = useRessource(listerPointsDeVente, 'cache_points_de_vente')
  const produits = useRessource(listerProduits, 'cache_produits')
  const clients = useRessource(listerClients, 'cache_clients')

  const clientsCash = useMemo(() => clients.filter((c) => c.mode_vente === 'CASH'), [clients])

  const [pointDeVenteId, setPointDeVenteId] = useState('')
  const [produitId, setProduitId] = useState('')
  const [clientId, setClientId] = useState('')
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
        type: 'VENTE_DIRECTE',
        produit: produitId,
        quantite,
        point_de_vente: pointDeVenteId,
        client: clientId || undefined,
        date_mouvement: new Date().toISOString(),
      },
    })
    setSucces('Vente directe enregistrée (synchronisation en cours ou en attente de réseau).')
    setQuantite('')
    setEnCours(false)
  }

  return (
    <Layout>
      <EnTeteBandeau
        titre="Vente directe"
        sousTitre="Vente comptant au bar, au restaurant ou au dépôt"
        icone={Store}
      />
      <p className="mb-4 text-sm text-slate-500">
        Vente payée immédiatement : aucun solde n'est modifié. Pour un client qui achète cash au
        dépôt, sélectionne-le pour garder une trace de son historique d'achats.
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
            <label className="mb-1 block text-sm font-medium text-slate-700">Client (facultatif)</label>
            <select
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
            >
              <option value="">Client de passage (anonyme)</option>
              {clientsCash.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nom}
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
          {enCours ? 'Enregistrement...' : 'Enregistrer la vente'}
        </button>
      </form>
    </Layout>
  )
}
