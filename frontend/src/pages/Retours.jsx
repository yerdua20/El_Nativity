import { useState } from 'react'
import {
  creerMouvement,
  listerClients,
  listerCommerciaux,
  listerPointsDeVente,
  listerProduits,
} from '../api/ressources'
import Nav from '../components/Nav'
import { useRessource } from '../hooks/useRessource'

export default function Retours() {
  const clients = useRessource(listerClients)
  const commerciaux = useRessource(listerCommerciaux)
  const produits = useRessource(listerProduits)
  const pointsDeVente = useRessource(listerPointsDeVente)

  const [type, setType] = useState('RETOUR_CLIENT')
  const [produitId, setProduitId] = useState('')
  const [quantite, setQuantite] = useState('')
  const [commercialId, setCommercialId] = useState('')
  const [clientId, setClientId] = useState('')
  const [pointDeVenteId, setPointDeVenteId] = useState('')
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
        type,
        produit: Number(produitId),
        quantite,
        commercial: Number(commercialId),
        client: type === 'RETOUR_CLIENT' ? Number(clientId) : undefined,
        point_de_vente: type === 'RETOUR_DEPOT' ? Number(pointDeVenteId) : undefined,
        date_mouvement: new Date().toISOString(),
      })
      setSucces('Retour enregistré.')
      setQuantite('')
    } catch {
      setErreur("Impossible d'enregistrer ce retour.")
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-6 text-xl font-semibold text-slate-900">Retour de marchandise</h1>

        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-4 flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={type === 'RETOUR_CLIENT'}
                onChange={() => setType('RETOUR_CLIENT')}
              />
              Retour du client vers le commercial
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={type === 'RETOUR_DEPOT'}
                onChange={() => setType('RETOUR_DEPOT')}
              />
              Retour du commercial vers le dépôt
            </label>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {type === 'RETOUR_CLIENT' && (
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
            )}

            {type === 'RETOUR_DEPOT' && (
              <select
                className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                value={pointDeVenteId}
                onChange={(event) => setPointDeVenteId(event.target.value)}
                required
              >
                <option value="" disabled>
                  Dépôt
                </option>
                {pointsDeVente.map((pdv) => (
                  <option key={pdv.id} value={pdv.id}>
                    {pdv.nom}
                  </option>
                ))}
              </select>
            )}

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
              placeholder="Quantité"
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
            {enCours ? 'Enregistrement...' : 'Enregistrer le retour'}
          </button>
        </form>
      </div>
    </div>
  )
}
