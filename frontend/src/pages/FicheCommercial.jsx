import { Briefcase, MapPin, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { creerClient, lireCommercial, listerClients } from '../api/ressources'
import EnTeteBandeau from '../components/EnTeteBandeau'
import Layout from '../components/Layout'

function Avatar({ nom }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-or-100 text-xs font-semibold text-or-700">
      {nom.slice(0, 2).toUpperCase()}
    </span>
  )
}

export default function FicheCommercial() {
  const { id } = useParams()
  const [commercial, setCommercial] = useState(null)
  const [clients, setClients] = useState([])
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)

  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [adresse, setAdresse] = useState('')
  const [position, setPosition] = useState(null)
  const [statutGps, setStatutGps] = useState('en_attente')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  function rafraichir() {
    lireCommercial(id).then(setCommercial)
    listerClients().then((liste) =>
      setClients(liste.filter((c) => String(c.commercial) === id && c.mode_vente !== 'CASH')),
    )
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

  async function handleSubmit(event) {
    event.preventDefault()
    setErreur('')
    setEnCours(true)
    try {
      const payload = { mode_vente: 'DEPOT_VENTE', commercial: Number(id), nom, telephone, adresse }
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
      setErreur('Impossible de créer ce client.')
    } finally {
      setEnCours(false)
    }
  }

  if (!commercial) {
    return (
      <Layout>
        <p className="text-sm text-slate-500">Chargement...</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <Link to="/commerciaux" className="mb-4 inline-block text-sm text-slate-500 underline hover:text-slate-700">
        ← Retour aux commerciaux
      </Link>

      <EnTeteBandeau
        titre={`${commercial.prenom} ${commercial.nom}`}
        sousTitre={commercial.telephone || 'Aucun téléphone renseigné'}
        icone={Briefcase}
      />

      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Solde marchandise</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{commercial.solde_marchandise}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Solde financier</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{commercial.solde_financier}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Ses clients en dépôt-vente</h2>
        <button
          onClick={() => setFormulaireOuvert((v) => !v)}
          className="flex items-center gap-1.5 rounded-2xl bg-or-500 px-3 py-2 text-sm font-medium text-white hover:bg-or-600"
        >
          <Plus className="h-4 w-4" />
          Nouveau client
        </button>
      </div>

      {formulaireOuvert && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        {clients.length === 0 && <p className="p-4 text-sm text-slate-500">Aucun client pour l'instant.</p>}
        {clients.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Téléphone</th>
                <th className="px-4 py-3 font-medium">Soldes</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((client) => (
                <tr key={client.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar nom={client.nom} />
                      {client.nom}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{client.telephone || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">
                    Marchandise : {client.solde_marchandise} · Financier : {client.solde_financier}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        client.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {client.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/clients/${client.id}`} className="text-or-600 underline hover:text-or-700">
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
