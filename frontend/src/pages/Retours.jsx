import { Undo2 } from 'lucide-react'
import { useState } from 'react'
import { listerClients, listerCommerciaux, listerPointsDeVente, listerProduits } from '../api/ressources'
import EnTeteBandeau from '../components/EnTeteBandeau'
import Layout from '../components/Layout'
import { useRessource } from '../hooks/useRessource'
import { mettreEnFile } from '../offline/sync'

export default function Retours() {
  const clients = useRessource(listerClients, 'cache_clients')
  const commerciaux = useRessource(listerCommerciaux, 'cache_commerciaux')
  const produits = useRessource(listerProduits, 'cache_produits')
  const pointsDeVente = useRessource(listerPointsDeVente, 'cache_points_de_vente')

  const [type, setType] = useState('RETOUR_CLIENT')
  const [produitId, setProduitId] = useState('')
  const [quantite, setQuantite] = useState('')
  const [commercialId, setCommercialId] = useState('')
  const [clientId, setClientId] = useState('')
  const [pointDeVenteId, setPointDeVenteId] = useState('')
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
        type,
        produit: produitId,
        quantite,
        commercial: commercialId,
        client: type === 'RETOUR_CLIENT' ? clientId : undefined,
        point_de_vente: type === 'RETOUR_DEPOT' ? pointDeVenteId : undefined,
        date_mouvement: new Date().toISOString(),
      },
    })
    setSucces('Retour enregistré (synchronisation en cours ou en attente de réseau).')
    setQuantite('')
    setEnCours(false)
  }

  return (
    <Layout>
      <EnTeteBandeau
        titre="Retours"
        sousTitre="Enregistrer un retour de marchandise chez un client"
        icone={Undo2}
      />

      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" checked={type === 'RETOUR_CLIENT'} onChange={() => setType('RETOUR_CLIENT')} />
            Retour du client vers le commercial
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={type === 'RETOUR_DEPOT'} onChange={() => setType('RETOUR_DEPOT')} />
            Retour du commercial vers le dépôt
          </label>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {type === 'RETOUR_CLIENT' && (
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
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nom}
                  </option>
                ))}
              </select>
            </div>
          )}

          {type === 'RETOUR_DEPOT' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Dépôt</label>
              <select
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
                value={pointDeVenteId}
                onChange={(event) => setPointDeVenteId(event.target.value)}
                required
              >
                <option value="" disabled>
                  Choisir un dépôt
                </option>
                {pointsDeVente.map((pdv) => (
                  <option key={pdv.id} value={pdv.id}>
                    {pdv.nom}
                  </option>
                ))}
              </select>
            </div>
          )}

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
            <label className="mb-1 block text-sm font-medium text-slate-700">Quantité</label>
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
          {enCours ? 'Enregistrement...' : 'Enregistrer le retour'}
        </button>
      </form>
    </Layout>
  )
}
