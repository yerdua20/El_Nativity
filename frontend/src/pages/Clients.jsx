import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { creerClient, listerClients, listerCommerciaux } from '../api/ressources'
import Nav from '../components/Nav'

export default function Clients() {
  const [clients, setClients] = useState(null)
  const [commerciaux, setCommerciaux] = useState([])
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [commercialId, setCommercialId] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  function rafraichirClients() {
    listerClients()
      .then(setClients)
      .catch(() => setErreur('Impossible de charger les clients.'))
  }

  useEffect(() => {
    rafraichirClients()
    listerCommerciaux().then((liste) => {
      setCommerciaux(liste)
      if (liste.length > 0) setCommercialId(String(liste[0].id))
    })
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setErreur('')
    setEnCours(true)
    try {
      await creerClient({ nom, telephone, commercial: Number(commercialId) })
      setNom('')
      setTelephone('')
      rafraichirClients()
    } catch {
      setErreur("Impossible de créer ce client.")
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-6 text-xl font-semibold text-slate-900">Clients</h1>

        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Nouveau client</h2>
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="Nom"
              value={nom}
              onChange={(event) => setNom(event.target.value)}
              required
            />
            <input
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="Téléphone"
              value={telephone}
              onChange={(event) => setTelephone(event.target.value)}
            />
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
          </div>
          {erreur && <p className="mb-3 text-sm text-red-600">{erreur}</p>}
          <button
            type="submit"
            disabled={enCours}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {enCours ? 'Création...' : 'Créer'}
          </button>
        </form>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          {!clients && <p className="text-sm text-slate-500">Chargement...</p>}
          {clients && clients.length === 0 && (
            <p className="text-sm text-slate-500">Aucun client pour l'instant.</p>
          )}
          {clients && clients.length > 0 && (
            <ul className="divide-y divide-slate-100 text-sm">
              {clients.map((client) => (
                <li key={client.id} className="flex justify-between py-2">
                  <Link to={`/clients/${client.id}`} className="text-slate-900 underline hover:text-slate-600">
                    {client.nom}
                  </Link>
                  <span className="text-slate-500">
                    Marchandise : {client.solde_marchandise} · Financier : {client.solde_financier}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
