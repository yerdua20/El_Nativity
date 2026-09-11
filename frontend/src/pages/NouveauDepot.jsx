import { MapPin, PackagePlus, UploadCloud } from 'lucide-react'
import { useState } from 'react'
import { listerClients, listerCommerciaux, listerProduits } from '../api/ressources'
import EnTeteBandeau from '../components/EnTeteBandeau'
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
      <EnTeteBandeau
        titre="Nouveau dépôt"
        sousTitre="Choisir un client et renseigner les informations du dépôt"
        icone={PackagePlus}
      />
      <p className="mb-4 text-sm text-slate-500">
        Fonctionne hors ligne : la saisie est conservée sur l'appareil et envoyée dès que le réseau
        revient (voir Synchronisation).
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

        <label className="mb-1 block text-sm font-medium text-slate-700">Photo du dépôt</label>
        <label className="mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-8 text-center hover:border-or-400">
          <UploadCloud className="h-6 w-6 text-slate-400" />
          <span className="text-sm text-slate-600">
            {photo ? photo.name : 'Choisir un fichier ou glisser-déposer'}
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => setPhoto(event.target.files[0] ?? null)}
            className="hidden"
          />
        </label>

        <div className="mb-6 flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-slate-400" />
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
              className="text-or-600 underline hover:text-or-700"
            >
              {statutGps === 'en_attente' ? 'capturer' : 'réessayer'}
            </button>
          )}
        </div>

        {succes && <p className="mb-3 text-sm text-green-600">{succes}</p>}

        <button
          type="submit"
          disabled={enCours}
          className="rounded-2xl bg-or-500 px-4 py-2 text-sm font-medium text-white hover:bg-or-600 disabled:opacity-50"
        >
          {enCours ? 'Enregistrement...' : 'Enregistrer le dépôt'}
        </button>
      </form>
    </Layout>
  )
}
