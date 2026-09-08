import { useEffect, useState } from 'react'
import { creerMouvementDepot, listerClients, listerCommerciaux, listerProduits } from '../api/ressources'
import Nav from '../components/Nav'

export default function NouveauDepot() {
  const [clients, setClients] = useState([])
  const [produits, setProduits] = useState([])
  const [commerciaux, setCommerciaux] = useState([])

  const [clientId, setClientId] = useState('')
  const [produitId, setProduitId] = useState('')
  const [commercialId, setCommercialId] = useState('')
  const [quantite, setQuantite] = useState('')
  const [photo, setPhoto] = useState(null)
  const [position, setPosition] = useState(null)
  const [statutGps, setStatutGps] = useState('en_attente')

  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [enCours, setEnCours] = useState(false)

  useEffect(() => {
    listerClients().then(setClients)
    listerProduits().then(setProduits)
    listerCommerciaux().then((liste) => {
      setCommerciaux(liste)
      if (liste.length > 0) setCommercialId(String(liste[0].id))
    })
    capturerPosition()
  }, [])

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
    setErreur('')
    setSucces('')
    setEnCours(true)

    const formData = new FormData()
    formData.append('uuid', crypto.randomUUID())
    formData.append('type', 'DEPOT_CLIENT')
    formData.append('produit', produitId)
    formData.append('quantite', quantite)
    formData.append('client', clientId)
    formData.append('commercial', commercialId)
    formData.append('date_mouvement', new Date().toISOString())
    if (position) {
      formData.append('latitude', position.latitude)
      formData.append('longitude', position.longitude)
    }
    if (photo) formData.append('photo', photo)

    try {
      await creerMouvementDepot(formData)
      setSucces('Dépôt enregistré.')
      setQuantite('')
      setPhoto(null)
    } catch {
      setErreur("Impossible d'enregistrer ce dépôt.")
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-6 text-xl font-semibold text-slate-900">Nouveau dépôt chez un client</h1>

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
                réessayer
              </button>
            )}
          </div>

          {erreur && <p className="mb-3 text-sm text-red-600">{erreur}</p>}
          {succes && <p className="mb-3 text-sm text-green-600">{succes}</p>}

          <button
            type="submit"
            disabled={enCours}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {enCours ? 'Enregistrement...' : 'Enregistrer le dépôt'}
          </button>
        </form>
      </div>
    </div>
  )
}
