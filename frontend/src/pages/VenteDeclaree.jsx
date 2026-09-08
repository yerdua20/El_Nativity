import { useState } from 'react'
import { creerMouvement, listerClients, listerCommerciaux, listerProduits } from '../api/ressources'
import Nav from '../components/Nav'
import { useRessource } from '../hooks/useRessource'

export default function VenteDeclaree() {
  const clients = useRessource(listerClients)
  const commerciaux = useRessource(listerCommerciaux)
  const produits = useRessource(listerProduits)

  const [clientId, setClientId] = useState('')
  const [commercialId, setCommercialId] = useState('')
  const [produitId, setProduitId] = useState('')
  const [quantite, setQuantite] = useState('')
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setErreur('')
    setSucces('')
    setEnCours(true)
    try {
      await creerMouvement({
        uuid: crypto.randomUUID(),
        type: 'VENTE_DECLAREE',
        produit: Number(produitId),
        quantite,
        client: Number(clientId),
        commercial: Number(commercialId),
        date_mouvement: new Date().toISOString(),
      })
      setSucces('Vente déclarée enregistrée.')
      setQuantite('')
    } catch {
      setErreur("Impossible d'enregistrer cette vente.")
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="mx-auto max-w-4xl px-6 py-8">
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

          {erreur && <p className="mb-3 text-sm text-red-600">{erreur}</p>}
          {succes && <p className="mb-3 text-sm text-green-600">{succes}</p>}

          <button
            type="submit"
            disabled={enCours}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {enCours ? 'Enregistrement...' : 'Déclarer la vente'}
          </button>
        </form>
      </div>
    </div>
  )
}
