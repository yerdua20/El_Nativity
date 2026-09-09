import { Briefcase, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { creerCommercial, listerCommerciaux, listerPointsDeVente, marquerCommercialParti } from '../api/ressources'
import EnTeteBandeau from '../components/EnTeteBandeau'
import Layout from '../components/Layout'
import { useRessource } from '../hooks/useRessource'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function Avatar({ nom, prenom }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-or-100 text-xs font-semibold text-or-700">
      {`${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()}
    </span>
  )
}

export default function Commerciaux() {
  const [commerciaux, setCommerciaux] = useState([])
  const pointsDeVente = useRessource(listerPointsDeVente, 'cache_points_de_vente')
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)

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

  const nomsPdv = useMemo(() => Object.fromEntries(pointsDeVente.map((p) => [p.id, p.nom])), [pointsDeVente])

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
      setFormulaireOuvert(false)
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
        "restent consultables mais il ne pourra plus se connecter à l'application terrain.",
    )
    if (!confirmation) return
    await marquerCommercialParti(commercial.id)
    rafraichir()
  }

  return (
    <Layout>
      <EnTeteBandeau titre="Commerciaux" sousTitre="Gérez les commerciaux et leurs informations" icone={Briefcase} />

      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setFormulaireOuvert((v) => !v)}
          className="flex items-center gap-1.5 rounded-2xl bg-or-500 px-3 py-2 text-sm font-medium text-white hover:bg-or-600"
        >
          <Plus className="h-4 w-4" />
          Nouveau commercial
        </button>
      </div>

      {formulaireOuvert && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              placeholder="Prénom"
              value={prenom}
              onChange={(event) => setPrenom(event.target.value)}
              required
            />
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
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              value={dateEntree}
              onChange={(event) => setDateEntree(event.target.value)}
              required
            />
          </div>
          {erreur && <p className="mb-3 text-sm text-red-600">{erreur}</p>}
          <button
            type="submit"
            disabled={enCours}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {enCours ? 'Création...' : 'Créer'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {commerciaux.length === 0 && <p className="p-4 text-sm text-slate-500">Aucun commercial pour l'instant.</p>}
        {commerciaux.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Téléphone</th>
                <th className="px-4 py-3 font-medium">Dépôt</th>
                <th className="px-4 py-3 font-medium">Soldes</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commerciaux.map((commercial) => (
                <tr key={commercial.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar nom={commercial.nom} prenom={commercial.prenom} />
                      {commercial.prenom} {commercial.nom}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{commercial.telephone || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{nomsPdv[commercial.point_de_vente] ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">
                    Marchandise : {commercial.solde_marchandise} · Financier : {commercial.solde_financier}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        commercial.actif ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {commercial.actif ? 'Actif' : `Parti le ${commercial.date_sortie}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {commercial.actif && (
                      <button
                        onClick={() => handleDepart(commercial)}
                        className="text-red-600 underline hover:text-red-800"
                      >
                        Marquer comme parti
                      </button>
                    )}
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
