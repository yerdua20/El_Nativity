import { MapPin, Plus, ShoppingCart, Undo2, UploadCloud, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  lireClient,
  lireStockClient,
  listerCommerciaux,
  listerEncaissements,
  listerMouvements,
  listerProduits,
} from '../api/ressources'
import EnTeteBandeau from '../components/EnTeteBandeau'
import Layout from '../components/Layout'
import { useRessource } from '../hooks/useRessource'
import { mettreEnFile } from '../offline/sync'

export default function FicheClient() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [mouvements, setMouvements] = useState([])
  const [encaissements, setEncaissements] = useState([])
  const [stockDetail, setStockDetail] = useState([])
  const produits = useRessource(listerProduits, 'cache_produits')
  const commerciaux = useRessource(listerCommerciaux, 'cache_commerciaux')
  const nomsProduits = Object.fromEntries(produits.map((p) => [p.id, p.nom]))

  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const [produitId, setProduitId] = useState('')
  const [commercialId, setCommercialId] = useState('')
  const [quantite, setQuantite] = useState('')
  const [photo, setPhoto] = useState(null)
  const [position, setPosition] = useState(null)
  const [statutGps, setStatutGps] = useState('en_attente')
  const [succes, setSucces] = useState('')
  const [enCours, setEnCours] = useState(false)

  const [formulaireVenteOuvert, setFormulaireVenteOuvert] = useState(false)
  const [produitVenteId, setProduitVenteId] = useState('')
  const [commercialVenteId, setCommercialVenteId] = useState('')
  const [quantiteVente, setQuantiteVente] = useState('')
  const [succesVente, setSuccesVente] = useState('')
  const [enCoursVente, setEnCoursVente] = useState(false)

  const [formulaireRetourOuvert, setFormulaireRetourOuvert] = useState(false)
  const [produitRetourId, setProduitRetourId] = useState('')
  const [quantiteRetour, setQuantiteRetour] = useState('')
  const [succesRetour, setSuccesRetour] = useState('')
  const [enCoursRetour, setEnCoursRetour] = useState(false)

  function rafraichir() {
    lireClient(id).then(setClient)
    listerMouvements(`/mouvements-stock/?client=${id}`).then((data) => setMouvements(data.results))
    listerEncaissements(`/encaissements/?client=${id}`).then((data) => setEncaissements(data.results))
    lireStockClient(id).then(setStockDetail)
  }

  useEffect(rafraichir, [id])

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

  async function handleSubmitDepot(event) {
    event.preventDefault()
    setSucces('')
    setEnCours(true)

    const payload = {
      uuid: crypto.randomUUID(),
      type: 'DEPOT_CLIENT',
      produit: produitId,
      quantite,
      client: id,
      commercial: commercialId,
      date_mouvement: new Date().toISOString(),
    }
    if (position) {
      payload.latitude = position.latitude
      payload.longitude = position.longitude
    }
    if (photo) payload.photo = photo

    await mettreEnFile({ endpoint: '/mouvements-stock/', payload, estMultipart: true })

    setSucces('Dépôt enregistré (synchronisation en cours ou en attente de réseau).')
    setQuantite('')
    setPhoto(null)
    setEnCours(false)
    rafraichir()
  }

  async function handleSubmitVente(event) {
    event.preventDefault()
    setSuccesVente('')
    setEnCoursVente(true)
    await mettreEnFile({
      endpoint: '/mouvements-stock/',
      payload: {
        uuid: crypto.randomUUID(),
        type: 'VENTE_DECLAREE',
        produit: produitVenteId,
        quantite: quantiteVente,
        client: id,
        commercial: commercialVenteId,
        date_mouvement: new Date().toISOString(),
      },
    })
    setSuccesVente('Vente déclarée enregistrée (synchronisation en cours ou en attente de réseau).')
    setQuantiteVente('')
    setEnCoursVente(false)
    rafraichir()
  }

  async function handleSubmitRetour(event) {
    event.preventDefault()
    setSuccesRetour('')
    setEnCoursRetour(true)
    await mettreEnFile({
      endpoint: '/mouvements-stock/',
      payload: {
        uuid: crypto.randomUUID(),
        type: 'RETOUR_CLIENT',
        produit: produitRetourId,
        quantite: quantiteRetour,
        client: id,
        date_mouvement: new Date().toISOString(),
      },
    })
    setSuccesRetour('Retour enregistré (synchronisation en cours ou en attente de réseau).')
    setQuantiteRetour('')
    setEnCoursRetour(false)
    rafraichir()
  }

  if (!client) {
    return (
      <Layout>
        <p className="text-sm text-slate-500">Chargement...</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <Link to="/clients" className="mb-4 inline-block text-sm text-slate-500 underline hover:text-slate-700">
        ← Retour aux clients
      </Link>

      <EnTeteBandeau
        titre={client.nom}
        sousTitre={[client.telephone, client.adresse].filter(Boolean).join(' · ') || 'Aucune information de contact'}
        icone={User}
      />

      {client.mode_vente === 'CASH' ? (
        <p className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Client cash : paiement comptant à chaque achat, aucun solde à suivre dans le temps. Voir
          l'historique de ses achats ci-dessous.
        </p>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Solde marchandise</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{client.solde_marchandise}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Solde financier</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{client.solde_financier}</p>
            </div>
          </div>

          <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Marchandise détenue par produit</h2>
            {stockDetail.length === 0 && (
              <p className="text-sm text-slate-500">Aucune marchandise en cours chez ce client.</p>
            )}
            {stockDetail.length > 0 && (
              <ul className="divide-y divide-slate-100 text-sm">
                {stockDetail.map((ligne) => (
                  <li key={ligne.produit} className="flex justify-between py-2">
                    <span>{ligne.produit_nom}</span>
                    <span className="font-medium text-slate-900">{ligne.quantite_restante}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Déposer de la marchandise</h2>
            <button
              onClick={() => setFormulaireOuvert((v) => !v)}
              className="flex items-center gap-1.5 rounded-2xl bg-or-500 px-3 py-2 text-sm font-medium text-white hover:bg-or-600"
            >
              <Plus className="h-4 w-4" />
              Nouveau dépôt
            </button>
          </div>

          {formulaireOuvert && (
            <form onSubmit={handleSubmitDepot} className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <select
                  className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
                  value={commercialId}
                  onChange={(event) => setCommercialId(event.target.value)}
                  required
                >
                  <option value="" disabled>
                    Personnel
                  </option>
                  {commerciaux.map((commercial) => (
                    <option key={commercial.id} value={commercial.id}>
                      {commercial.prenom} {commercial.nom}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
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
                  placeholder="Quantité"
                  className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
                  value={quantite}
                  onChange={(event) => setQuantite(event.target.value)}
                  required
                />
              </div>

              <label className="mt-3 mb-1 block text-sm font-medium text-slate-700">Photo du dépôt</label>
              <label className="mb-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-6 text-center hover:border-or-400">
                <UploadCloud className="h-5 w-5 text-slate-400" />
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

              <div className="mb-3 flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-700">Position GPS :</span>
                {statutGps === 'en_attente' && <span className="text-slate-500">non capturée</span>}
                {statutGps === 'en_cours' && <span className="text-slate-500">capture en cours...</span>}
                {statutGps === 'capturee' && position && (
                  <span className="text-green-600">
                    {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
                  </span>
                )}
                {statutGps === 'refusee' && <span className="text-amber-600">refusée par le navigateur</span>}
                {statutGps === 'indisponible' && <span className="text-amber-600">non disponible</span>}
                {statutGps !== 'en_cours' && (
                  <button type="button" onClick={capturerPosition} className="text-or-600 underline hover:text-or-700">
                    {statutGps === 'en_attente' ? 'capturer' : 'réessayer'}
                  </button>
                )}
              </div>

              {succes && <p className="mb-3 text-sm text-green-600">{succes}</p>}
              <button
                type="submit"
                disabled={enCours}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {enCours ? 'Enregistrement...' : 'Enregistrer le dépôt'}
              </button>
            </form>
          )}

          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Déclarer une vente</h2>
            <button
              onClick={() => setFormulaireVenteOuvert((v) => !v)}
              className="flex items-center gap-1.5 rounded-2xl bg-or-500 px-3 py-2 text-sm font-medium text-white hover:bg-or-600"
            >
              <ShoppingCart className="h-4 w-4" />
              Déclarer une vente
            </button>
          </div>

          {formulaireVenteOuvert && (
            <form onSubmit={handleSubmitVente} className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm text-slate-500">
                Le solde marchandise diminue d'autant, le solde financier augmente (vente désormais
                reconnue).
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <select
                  className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
                  value={commercialVenteId}
                  onChange={(event) => setCommercialVenteId(event.target.value)}
                  required
                >
                  <option value="" disabled>
                    Personnel
                  </option>
                  {commerciaux.map((commercial) => (
                    <option key={commercial.id} value={commercial.id}>
                      {commercial.prenom} {commercial.nom}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
                  value={produitVenteId}
                  onChange={(event) => setProduitVenteId(event.target.value)}
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
                  placeholder="Quantité vendue"
                  className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
                  value={quantiteVente}
                  onChange={(event) => setQuantiteVente(event.target.value)}
                  required
                />
              </div>

              {succesVente && <p className="mt-3 text-sm text-green-600">{succesVente}</p>}
              <button
                type="submit"
                disabled={enCoursVente}
                className="mt-3 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {enCoursVente ? 'Enregistrement...' : 'Déclarer la vente'}
              </button>
            </form>
          )}

          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Retour de marchandise invendue</h2>
            <button
              onClick={() => setFormulaireRetourOuvert((v) => !v)}
              className="flex items-center gap-1.5 rounded-2xl bg-or-500 px-3 py-2 text-sm font-medium text-white hover:bg-or-600"
            >
              <Undo2 className="h-4 w-4" />
              Nouveau retour
            </button>
          </div>

          {formulaireRetourOuvert && (
            <form onSubmit={handleSubmitRetour} className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm text-slate-500">
                La quantité retournée recrédite directement le stock du dépôt central.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select
                  className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
                  value={produitRetourId}
                  onChange={(event) => setProduitRetourId(event.target.value)}
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
                  placeholder="Quantité"
                  className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
                  value={quantiteRetour}
                  onChange={(event) => setQuantiteRetour(event.target.value)}
                  required
                />
              </div>

              {succesRetour && <p className="mt-3 text-sm text-green-600">{succesRetour}</p>}
              <button
                type="submit"
                disabled={enCoursRetour}
                className="mt-3 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {enCoursRetour ? 'Enregistrement...' : 'Enregistrer le retour'}
              </button>
            </form>
          )}
        </>
      )}

      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          {client.mode_vente === 'CASH' ? 'Historique des achats' : 'Mouvements de stock'}
        </h2>
        {mouvements.length === 0 && <p className="text-sm text-slate-500">Aucun mouvement.</p>}
        {mouvements.length > 0 && (
          <ul className="divide-y divide-slate-100 text-sm">
            {mouvements.map((mouvement) => (
              <li key={mouvement.id} className="flex justify-between py-2">
                <span>
                  {mouvement.type} — {nomsProduits[mouvement.produit] ?? mouvement.produit} x
                  {mouvement.quantite}
                </span>
                <span className="text-slate-500">{new Date(mouvement.date_mouvement).toLocaleDateString('fr-FR')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {client.mode_vente !== 'CASH' && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Encaissements</h2>
          {encaissements.length === 0 && <p className="text-sm text-slate-500">Aucun encaissement.</p>}
          {encaissements.length > 0 && (
            <ul className="divide-y divide-slate-100 text-sm">
              {encaissements.map((encaissement) => (
                <li key={encaissement.id} className="flex justify-between py-2">
                  <span>
                    {encaissement.montant} ({encaissement.moyen_paiement})
                  </span>
                  <span className="text-slate-500">
                    {new Date(encaissement.date_encaissement).toLocaleDateString('fr-FR')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Layout>
  )
}
