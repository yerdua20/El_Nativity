import { CalendarClock, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { creerReservation, listerPointsDeVente, listerReservations, modifierReservation } from '../api/ressources'
import EnTeteBandeau from '../components/EnTeteBandeau'
import Layout from '../components/Layout'
import { useRessource } from '../hooks/useRessource'

const LIBELLES_STATUT = {
  CONFIRMEE: 'Confirmée',
  ANNULEE: 'Annulée',
  HONOREE: 'Honorée',
}

const CLASSES_STATUT = {
  CONFIRMEE: 'bg-blue-100 text-blue-700',
  ANNULEE: 'bg-slate-200 text-slate-600',
  HONOREE: 'bg-green-100 text-green-700',
}

function dansUneHeure() {
  const date = new Date(Date.now() + 60 * 60 * 1000)
  date.setMinutes(0, 0, 0)
  return date.toISOString().slice(0, 16)
}

export default function Reservations() {
  const [reservations, setReservations] = useState([])
  const pointsDeVente = useRessource(listerPointsDeVente, 'cache_points_de_vente')
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)

  const pointsDeVenteReservables = useMemo(
    () => pointsDeVente.filter((pdv) => pdv.type_pdv === 'BAR' || pdv.type_pdv === 'RESTAURANT'),
    [pointsDeVente],
  )
  const nomsPdv = useMemo(() => Object.fromEntries(pointsDeVente.map((p) => [p.id, p.nom])), [pointsDeVente])

  const [pointDeVenteId, setPointDeVenteId] = useState('')
  const [nomClient, setNomClient] = useState('')
  const [telephoneClient, setTelephoneClient] = useState('')
  const [typeEvenement, setTypeEvenement] = useState('')
  const [nombrePersonnes, setNombrePersonnes] = useState('')
  const [dateReservation, setDateReservation] = useState(dansUneHeure())
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  function rafraichir() {
    listerReservations().then(setReservations)
  }

  useEffect(rafraichir, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setErreur('')
    setEnCours(true)
    try {
      await creerReservation({
        uuid: crypto.randomUUID(),
        point_de_vente: Number(pointDeVenteId),
        nom_client: nomClient,
        telephone_client: telephoneClient,
        type_evenement: typeEvenement,
        nombre_personnes: Number(nombrePersonnes),
        date_reservation: new Date(dateReservation).toISOString(),
      })
      setNomClient('')
      setTelephoneClient('')
      setTypeEvenement('')
      setNombrePersonnes('')
      setDateReservation(dansUneHeure())
      setFormulaireOuvert(false)
      rafraichir()
    } catch {
      setErreur('Impossible de créer cette réservation.')
    } finally {
      setEnCours(false)
    }
  }

  async function changerStatut(reservation, statut) {
    await modifierReservation(reservation.id, { statut })
    rafraichir()
  }

  return (
    <Layout>
      <EnTeteBandeau
        titre="Réservations"
        sousTitre="Gérez les réservations de table au bar et au restaurant"
        icone={CalendarClock}
      />

      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setFormulaireOuvert((v) => !v)}
          className="flex items-center gap-1.5 rounded-2xl bg-or-500 px-3 py-2 text-sm font-medium text-white hover:bg-or-600"
        >
          <Plus className="h-4 w-4" />
          Nouvelle réservation
        </button>
      </div>

      {formulaireOuvert && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              value={pointDeVenteId}
              onChange={(event) => setPointDeVenteId(event.target.value)}
              required
            >
              <option value="" disabled>
                Point de vente
              </option>
              {pointsDeVenteReservables.map((pdv) => (
                <option key={pdv.id} value={pdv.id}>
                  {pdv.nom}
                </option>
              ))}
            </select>
            <input
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              placeholder="Nom du client"
              value={nomClient}
              onChange={(event) => setNomClient(event.target.value)}
              required
            />
            <input
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              placeholder="Téléphone"
              value={telephoneClient}
              onChange={(event) => setTelephoneClient(event.target.value)}
            />
            <input
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              placeholder="Type d'événement (anniversaire, mariage...)"
              value={typeEvenement}
              onChange={(event) => setTypeEvenement(event.target.value)}
            />
            <input
              type="number"
              min="1"
              step="1"
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              placeholder="Nombre de personnes"
              value={nombrePersonnes}
              onChange={(event) => setNombrePersonnes(event.target.value)}
              required
            />
            <input
              type="datetime-local"
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              value={dateReservation}
              onChange={(event) => setDateReservation(event.target.value)}
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
        {reservations.length === 0 && <p className="p-4 text-sm text-slate-500">Aucune réservation pour l'instant.</p>}
        {reservations.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Point de vente</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Événement</th>
                <th className="px-4 py-3 font-medium">Personnes</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(reservation.date_reservation).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{nomsPdv[reservation.point_de_vente] ?? '—'}</td>
                  <td className="px-4 py-3">
                    {reservation.nom_client}
                    {reservation.telephone_client && (
                      <span className="text-slate-500"> · {reservation.telephone_client}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{reservation.type_evenement || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{reservation.nombre_personnes}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${CLASSES_STATUT[reservation.statut]}`}>
                      {LIBELLES_STATUT[reservation.statut]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {reservation.statut === 'CONFIRMEE' && (
                      <>
                        <button
                          onClick={() => changerStatut(reservation, 'HONOREE')}
                          className="mr-3 text-green-700 underline hover:text-green-900"
                        >
                          Marquer honorée
                        </button>
                        <button
                          onClick={() => changerStatut(reservation, 'ANNULEE')}
                          className="text-red-600 underline hover:text-red-800"
                        >
                          Annuler
                        </button>
                      </>
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
