import { useState } from 'react'
import { listerClients, listerCommerciaux, listerProduits } from '../api/ressources'
import Layout from '../components/Layout'
import { useRessource } from '../hooks/useRessource'
import { mettreEnFile } from '../offline/sync'

export default function NouveauDepot() {
  const clients = useRessource(listerClients, 'cache_clients')
  const produits = useRessource(listerProduits, 'cache_produits')
  const commerciaux = useRessource(listerCommerciaux, 'cache_commerciaux')

  const [clientId, setClientId] = useState('')
  const [produitId, setProduitId] = useState('')
  const [commercialId, setCommercialId] = useState('')
  const [quantite, setQuantite] = useState('')
  const [photo, setPhoto] = useState(null)
  const [position, setPosition] = useState(null)
  const [statutGps, setStatutGps] = useState('en_attente')

  const [succes, setSucces] = useState('')
  const [enCours, setEnCours] = useState(false)

  function capturerPosition() {
    if (!navigator.geolocation) {
      setStatutGps('indisponible')
      return
    }
    setStatutGps('en_cours')
    navigator.geolocation.getCurrentPosition(
      (resultat) => {
        setPosition({ latitude: resultat.coords.latitude, longitude: resultat.coords.longitude })
        setStatutGps('capturee')
      },
      () => setStatutGps('refusee'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSucces('')
    setEnCours(true)

    const payload = {
      uuid: crypto.randomUUID(),
      type: 'DEPOT_CLIENT',
      produit: produitId,
      quantite,
      client: clientId,
      commercial: commercialId,
      date_mouvement: new Date().toISOString(),
    }
    if (position) {
      payload.latitude = position.latitude
      payload.longitude = position.longitude
    }
    if (photo) payload.photo = photo

    // mettreEnFile écrit d'abord en local (IndexedDB) puis tente une
    // synchronisation immédiate si le réseau est là : cet appel ne
    // peut pas échouer pour une raison réseau, la saisie terrain
    // n'est donc jamais bloquée par une coupure.
    await mettreEnFile({ endpoint: '/mouvements-stock/', payload, estMultipart: true })

    setSucces('Dépôt enregistré (synchronisation en cours ou en attente de réseau).')
    setQuantite('')
    setPhoto(null)
    setEnCours(false)
  }

  return (
    <Layout>
        <h1 className="mb-6 text-xl font-semibold text-slate-900">Nouveau dépôt chez un client</h1>
        <p className="mb-6 text-sm text-slate-500">
          Fonctionne hors ligne : la saisie est conservée sur l'appareil et envoyée dès que le
          réseau revient (voir l'onglet Synchronisation).
        </p>

        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              placeholder="Quantité"
              value={quantite}
              onChange={(event) => setQuantite(event.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-slate-700">Photo</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => setPhoto(event.target.files[0] ?? null)}
              className="block w-full text-sm"
            />
          </div>

          <div className="mb-4 flex items-center gap-3 text-sm">
            <span className="font-medium text-slate-700">Position GPS :</span>
            {statutGps === 'en_cours' && <span className="text-slate-500">capture en cours...</span>}
            {statutGps === 'capturee' && (
              <span className="text-green-600">
                {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
              </span>
            )}
            {statutGps === 'refusee' && <span className="text-amber-600">refusée par le navigateur</span>}
            {statutGps === 'indisponible' && <span className="text-amber-600">non disponible</span>}
            {statutGps !== 'en_cours' && (
              <button
                type="button"
                onClick={capturerPosition}
                className="text-slate-500 underline hover:text-slate-700"
              >
                {statutGps === 'en_attente' ? 'capturer' : 'réessayer'}
              </button>
            )}
          </div>

          {succes && <p className="mb-3 text-sm text-green-600">{succes}</p>}

          <button
            type="submit"
            disabled={enCours}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {enCours ? 'Enregistrement...' : 'Enregistrer le dépôt'}
          </button>
        </form>
    </Layout>
  )
}
