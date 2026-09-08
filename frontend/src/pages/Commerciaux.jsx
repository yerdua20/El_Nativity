import { useEffect, useState } from 'react'
import { creerCommercial, listerCommerciaux, listerPointsDeVente, marquerCommercialParti } from '../api/ressources'
import Nav from '../components/Nav'
import { useRessource } from '../hooks/useRessource'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function Commerciaux() {
  const [commerciaux, setCommerciaux] = useState([])
  const pointsDeVente = useRessource(listerPointsDeVente, 'cache_points_de_vente')

  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [pointDeVenteId, setPointDeVenteId] = useState('')
  const [dateEntree, setDateEntree] = useState(todayISO())
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  function rafraichir() {
    listerCommerciaux().then(setCommerciaux)
  }

  useEffect(rafraichir, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setErreur('')
    setEnCours(true)
    try {
      await creerCommercial({
        nom,
        prenom,
        telephone,
        point_de_vente: Number(pointDeVenteId),
        date_entree: dateEntree,
      })
      setNom('')
      setPrenom('')
      setTelephone('')
      rafraichir()
    } catch {
      setErreur('Impossible de créer ce commercial.')
    } finally {
      setEnCours(false)
    }
  }

  async function handleDepart(commercial) {
    const confirmation = window.confirm(
      `Marquer ${commercial.prenom} ${commercial.nom} comme parti ? ` +
        `Ses soldes (marchandise : ${commercial.solde_marchandise}, financier : ${commercial.solde_financier}) ` +
        'restent consultables mais il ne pourra plus se connecter à l\'application terrain.',
    )
    if (!confirmation) return
    await marquerCommercialParti(commercial.id)
    rafraichir()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-6 text-xl font-semibold text-slate-900">Commerciaux</h1>

        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Nouveau commercial</h2>
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="Prénom"
              value={prenom}
              onChange={(event) => setPrenom(event.target.value)}
              required
            />
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
              value={pointDeVenteId}
              onChange={(event) => setPointDeVenteId(event.target.value)}
              required
            >
              <option value="" disabled>
                Dépôt de rattachement
              </option>
              {pointsDeVente.map((pdv) => (
                <option key={pdv.id} value={pdv.id}>
                  {pdv.nom}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              value={dateEntree}
              onChange={(event) => setDateEntree(event.target.value)}
              required
            />
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
          {commerciaux.length === 0 && (
            <p className="text-sm text-slate-500">Aucun commercial pour l'instant.</p>
          )}
          {commerciaux.length > 0 && (
            <ul className="divide-y divide-slate-100 text-sm">
              {commerciaux.map((commercial) => (
                <li key={commercial.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {commercial.prenom} {commercial.nom}
                      {!commercial.actif && (
                        <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                          Parti le {commercial.date_sortie}
                        </span>
                      )}
                    </p>
                    <p className="text-slate-500">
                      Marchandise : {commercial.solde_marchandise} · Financier :{' '}
                      {commercial.solde_financier}
                    </p>
                  </div>
                  {commercial.actif && (
                    <button
                      onClick={() => handleDepart(commercial)}
                      className="text-red-600 underline hover:text-red-800"
                    >
                      Marquer comme parti
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
