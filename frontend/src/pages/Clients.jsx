import { Plus, Search, Users } from 'lucide-react'
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

export default function Clients() {
  const [clients, setClients] = useState(null)
  const [commerciaux, setCommerciaux] = useState([])
  const [recherche, setRecherche] = useState('')
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)

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

  const nomsCommerciaux = useMemo(
    () => Object.fromEntries(commerciaux.map((c) => [c.id, `${c.prenom} ${c.nom}`])),
    [commerciaux],
  )

  const clientsFiltres = useMemo(() => {
    if (!clients) return null
    const terme = recherche.trim().toLowerCase()
    if (!terme) return clients
    return clients.filter((c) => c.nom.toLowerCase().includes(terme))
  }, [clients, recherche])

  async function handleSubmit(event) {
    event.preventDefault()
    setErreur('')
    setEnCours(true)
    try {
      await creerClient({ nom, telephone, commercial: Number(commercialId) })
      setNom('')
      setTelephone('')
      setFormulaireOuvert(false)
      rafraichirClients()
    } catch {
      setErreur("Impossible de créer ce client.")
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Layout>
      <EnTeteBandeau titre="Gestion des clients" sousTitre="Consultez et gérez vos clients" icone={Users} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded border border-slate-300 py-2 pr-3 pl-9 text-sm focus:border-or-400 focus:outline-none"
            placeholder="Rechercher un client..."
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
          />
        </div>
        <button
          onClick={() => setFormulaireOuvert((v) => !v)}
          className="flex items-center gap-1.5 rounded-2xl bg-or-500 px-3 py-2 text-sm font-medium text-white hover:bg-or-600"
        >
          <Plus className="h-4 w-4" />
          Nouveau client
        </button>
      </div>

      {formulaireOuvert && (
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-4">
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
            placeholder="Nom"
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
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
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
          <button
            type="submit"
            disabled={enCours}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {enCours ? 'Création...' : 'Créer'}
          </button>
          {erreur && <p className="text-sm text-red-600 sm:col-span-4">{erreur}</p>}
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {!clientsFiltres && <p className="p-4 text-sm text-slate-500">Chargement...</p>}
        {clientsFiltres && clientsFiltres.length === 0 && (
          <p className="p-4 text-sm text-slate-500">Aucun client trouvé.</p>
        )}
        {clientsFiltres && clientsFiltres.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Téléphone</th>
                <th className="px-4 py-3 font-medium">Commercial</th>
                <th className="px-4 py-3 font-medium">Soldes</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientsFiltres.map((client) => (
                <tr key={client.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar nom={client.nom} />
                      {client.nom}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{client.telephone || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{nomsCommerciaux[client.commercial] ?? '—'}</td>
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
