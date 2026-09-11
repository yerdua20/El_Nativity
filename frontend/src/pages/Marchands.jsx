import { MapPin, Plus, Search, Store } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { creerClient, listerClients, listerCommerciaux } from '../api/ressources'
import EnTeteBandeau from '../components/EnTeteBandeau'
import Layout from '../components/Layout'

function Avatar({ nom }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-or-100 text-xs font-semibold text-or-700">
      {nom.slice(0, 2).toUpperCase()}
    </span>
  )
}

export default function Marchands() {
  const [marchands, setMarchands] = useState(null)
  const [commerciaux, setCommerciaux] = useState([])
  const [recherche, setRecherche] = useState('')
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)

  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [adresse, setAdresse] = useState('')
  const [commercialId, setCommercialId] = useState('')
  const [position, setPosition] = useState(null)
  const [statutGps, setStatutGps] = useState('en_attente')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  function rafraichir() {
    listerClients()
      .then((liste) => setMarchands(liste.filter((c) => c.mode_vente === 'DEPOT_VENTE')))
      .catch(() => setErreur('Impossible de charger les marchands.'))
  }

  useEffect(() => {
    rafraichir()
    listerCommerciaux().then((liste) => {
      setCommerciaux(liste)
      if (liste.length > 0) setCommercialId(String(liste[0].id))
    })
  }, [])

  const nomsCommerciaux = useMemo(
    () => Object.fromEntries(commerciaux.map((c) => [c.id, `${c.prenom} ${c.nom}`])),
    [commerciaux],
  )

  const marchandsFiltres = useMemo(() => {
    if (!marchands) return null
    const terme = recherche.trim().toLowerCase()
    if (!terme) return marchands
    return marchands.filter((c) => c.nom.toLowerCase().includes(terme))
  }, [marchands, recherche])

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
    setEnCours(true)
    try {
      const payload = {
        mode_vente: 'DEPOT_VENTE',
        commercial: Number(commercialId),
        nom,
        telephone,
        adresse,
      }
      if (position) {
        payload.latitude = position.latitude
        payload.longitude = position.longitude
      }
      await creerClient(payload)
      setNom('')
      setTelephone('')
      setAdresse('')
      setPosition(null)
      setStatutGps('en_attente')
      setFormulaireOuvert(false)
      rafraichir()
    } catch {
      setErreur('Impossible de créer ce marchand.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Layout>
      <EnTeteBandeau
        titre="Marchands"
        sousTitre="Boutiques en dépôt-vente : marchandise confiée, à rendre compte"
        icone={Store}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded border border-slate-300 py-2 pr-3 pl-9 text-sm focus:border-or-400 focus:outline-none"
            placeholder="Rechercher un marchand..."
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
          />
        </div>
        <button
          onClick={() => setFormulaireOuvert((v) => !v)}
          className="flex items-center gap-1.5 rounded-2xl bg-or-500 px-3 py-2 text-sm font-medium text-white hover:bg-or-600"
        >
          <Plus className="h-4 w-4" />
          Nouveau marchand
        </button>
      </div>

      {formulaireOuvert && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <input
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              placeholder="Nom / boutique"
              value={nom}
              onChange={(event) => setNom(event.target.value)}
              required
            />
            <input
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              placeholder="Téléphone"
              value={telephone}
              onChange={(event) => setTelephone(event.target.value)}
            />
            <input
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              placeholder="Adresse"
              value={adresse}
              onChange={(event) => setAdresse(event.target.value)}
            />
            <select
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              value={commercialId}
              onChange={(event) => setCommercialId(event.target.value)}
              required
            >
              <option value="" disabled>
                Commercial responsable
              </option>
              {commerciaux.map((commercial) => (
                <option key={commercial.id} value={commercial.id}>
                  {commercial.prenom} {commercial.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-slate-400" />
            {statutGps === 'en_attente' && <span className="text-slate-500">Position non capturée</span>}
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

          {erreur && <p className="mt-3 text-sm text-red-600">{erreur}</p>}
          <button
            type="submit"
            disabled={enCours}
            className="mt-3 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {enCours ? 'Création...' : 'Créer'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {!marchandsFiltres && <p className="p-4 text-sm text-slate-500">Chargement...</p>}
        {marchandsFiltres && marchandsFiltres.length === 0 && (
          <p className="p-4 text-sm text-slate-500">Aucun marchand trouvé.</p>
        )}
        {marchandsFiltres && marchandsFiltres.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Téléphone</th>
                <th className="px-4 py-3 font-medium">Commercial responsable</th>
                <th className="px-4 py-3 font-medium">Soldes</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {marchandsFiltres.map((marchand) => (
                <tr key={marchand.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar nom={marchand.nom} />
                      {marchand.nom}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{marchand.telephone || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{nomsCommerciaux[marchand.commercial] ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">
                    Marchandise : {marchand.solde_marchandise} · Financier : {marchand.solde_financier}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        marchand.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {marchand.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/clients/${marchand.id}`} className="text-or-600 underline hover:text-or-700">
                      Voir la fiche
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
