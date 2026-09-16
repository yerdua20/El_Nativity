import { History, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  listerClients,
  listerEncaissements,
  listerMouvements,
  listerPointsDeVente,
  listerProduits,
  listerReservations,
} from '../api/ressources'
import { useAuth } from '../auth/AuthContext'
import EnTeteBandeau from '../components/EnTeteBandeau'
import Layout from '../components/Layout'

const LIBELLES_TYPE = {
  ENTREE_DEPOT: 'Entrée dépôt',
  DEPOT_CLIENT: 'Dépôt marchand',
  VENTE_DECLAREE: 'Vente déclarée',
  RETOUR_CLIENT: 'Retour marchand',
  VENTE_DIRECTE: 'Vente directe',
  PERTE: 'Perte',
}

// Réception de stock et pertes concernent les deux circuits (le
// dépôt central alimente aussi bien les marchands que le bar/
// restaurant) : elles apparaissent dans les deux historiques.
const TYPES_VENTES = ['DEPOT_CLIENT', 'VENTE_DECLAREE', 'RETOUR_CLIENT', 'ENTREE_DEPOT', 'PERTE']
const TYPES_BAR_RESTO = ['VENTE_DIRECTE', 'ENTREE_DEPOT', 'PERTE']

const LIBELLES_STATUT_RESA = {
  CONFIRMEE: 'Confirmée',
  ANNULEE: 'Annulée',
  HONOREE: 'Honorée',
}

const CLASSES_STATUT_RESA = {
  CONFIRMEE: 'bg-blue-100 text-blue-700',
  ANNULEE: 'bg-slate-200 text-slate-600',
  HONOREE: 'bg-green-100 text-green-700',
}

function useNoms(fetcher) {
  const [parId, setParId] = useState({})

  useEffect(() => {
    fetcher().then((liste) => {
      setParId(Object.fromEntries(liste.map((item) => [item.id, item.nom])))
    })
  }, [fetcher])

  return parId
}

function useListePaginee(fetcher) {
  const [page, setPage] = useState(null)
  const [chargement, setChargement] = useState(true)

  function charger(url) {
    setChargement(true)
    fetcher(url).then((donnees) => {
      setPage(donnees)
      setChargement(false)
    })
  }

  useEffect(() => {
    charger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    resultats: page?.results ?? [],
    count: page?.count ?? 0,
    chargement,
    suivant: page?.next ? () => charger(page.next) : null,
    precedent: page?.previous ? () => charger(page.previous) : null,
  }
}

function BoutonsPagination({ precedent, suivant }) {
  if (!precedent && !suivant) return null
  return (
    <div className="mt-3 flex justify-end gap-2 text-sm">
      <button
        onClick={precedent}
        disabled={!precedent}
        className="rounded-2xl border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
      >
        Précédent
      </button>
      <button
        onClick={suivant}
        disabled={!suivant}
        className="rounded-2xl border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
      >
        Suivant
      </button>
    </div>
  )
}

function SectionMouvements({ types, nomsProduits, recherche }) {
  const mouvements = useListePaginee((url) => listerMouvements(url || `/mouvements-stock/?type__in=${types.join(',')}`))

  const mouvementsFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase()
    if (!terme) return mouvements.resultats
    return mouvements.resultats.filter((m) => {
      const texte = `${LIBELLES_TYPE[m.type] ?? m.type} ${nomsProduits[m.produit] ?? ''}`.toLowerCase()
      return texte.includes(terme)
    })
  }, [mouvements.resultats, recherche, nomsProduits])

  return (
    <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Mouvements de stock ({mouvements.count})</h2>
      {mouvements.chargement && <p className="text-sm text-slate-500">Chargement...</p>}
      {!mouvements.chargement && mouvementsFiltres.length === 0 && (
        <p className="text-sm text-slate-500">Aucun mouvement.</p>
      )}
      {mouvementsFiltres.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Produit</th>
                <th className="py-2 pr-3">Qté</th>
                <th className="py-2 pr-3">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mouvementsFiltres.map((mouvement) => (
                <tr key={mouvement.id}>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {new Date(mouvement.date_mouvement).toLocaleString('fr-FR')}
                  </td>
                  <td className="py-2 pr-3">{LIBELLES_TYPE[mouvement.type] ?? mouvement.type}</td>
                  <td className="py-2 pr-3">{nomsProduits[mouvement.produit] ?? mouvement.produit}</td>
                  <td className="py-2 pr-3">{mouvement.quantite}</td>
                  <td className="py-2 pr-3">{mouvement.montant ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <BoutonsPagination precedent={mouvements.precedent} suivant={mouvements.suivant} />
    </div>
  )
}

function SectionEncaissements({ nomsClients }) {
  const encaissements = useListePaginee(listerEncaissements)

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Encaissements ({encaissements.count})</h2>
      {encaissements.chargement && <p className="text-sm text-slate-500">Chargement...</p>}
      {!encaissements.chargement && encaissements.resultats.length === 0 && (
        <p className="text-sm text-slate-500">Aucun encaissement.</p>
      )}
      {encaissements.resultats.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Client</th>
                <th className="py-2 pr-3">Montant</th>
                <th className="py-2 pr-3">Moyen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {encaissements.resultats.map((encaissement) => (
                <tr key={encaissement.id}>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {new Date(encaissement.date_encaissement).toLocaleString('fr-FR')}
                  </td>
                  <td className="py-2 pr-3">{nomsClients[encaissement.client] ?? encaissement.client}</td>
                  <td className="py-2 pr-3">{encaissement.montant}</td>
                  <td className="py-2 pr-3">{encaissement.moyen_paiement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <BoutonsPagination precedent={encaissements.precedent} suivant={encaissements.suivant} />
    </div>
  )
}

function SectionReservations({ nomsPdv }) {
  const [reservations, setReservations] = useState(null)

  useEffect(() => {
    listerReservations().then(setReservations)
  }, [])

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">
        Réservations ({reservations?.length ?? 0})
      </h2>
      {reservations === null && <p className="text-sm text-slate-500">Chargement...</p>}
      {reservations?.length === 0 && <p className="text-sm text-slate-500">Aucune réservation.</p>}
      {reservations?.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Point de vente</th>
                <th className="py-2 pr-3">Client</th>
                <th className="py-2 pr-3">Personnes</th>
                <th className="py-2 pr-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {new Date(reservation.date_reservation).toLocaleString('fr-FR')}
                  </td>
                  <td className="py-2 pr-3">{nomsPdv[reservation.point_de_vente] ?? reservation.point_de_vente}</td>
                  <td className="py-2 pr-3">{reservation.nom_client}</td>
                  <td className="py-2 pr-3">{reservation.nombre_personnes}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${CLASSES_STATUT_RESA[reservation.statut]}`}
                    >
                      {LIBELLES_STATUT_RESA[reservation.statut] ?? reservation.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function Historique() {
  const { niveau } = useAuth()
  const nomsClients = useNoms(listerClients)
  const nomsProduits = useNoms(listerProduits)
  const nomsPdv = useNoms(listerPointsDeVente)
  const [recherche, setRecherche] = useState('')

  // Chacun retrouve ici l'historique de son propre périmètre : ventes
  // marchands pour la chargée des ventes, bar/restaurant/réservations
  // pour le gérant. PDG, Admin et comptable voient les deux, au choix.
  const onglets = useMemo(() => {
    if (niveau === 'GERANT') return ['bar_resto']
    if (niveau === 'CHARGE_VENTES') return ['ventes']
    return ['ventes', 'bar_resto']
  }, [niveau])

  const [onglet, setOnglet] = useState(onglets[0])

  useEffect(() => {
    if (!onglets.includes(onglet)) setOnglet(onglets[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onglets])

  return (
    <Layout>
      <EnTeteBandeau titre="Historique" sousTitre="Consultez l'historique de vos opérations" icone={History} />

      {onglets.length > 1 && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setOnglet('ventes')}
            className={`rounded-2xl px-4 py-2 text-sm font-medium ${
              onglet === 'ventes' ? 'bg-vert-700 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Ventes (marchands)
          </button>
          <button
            onClick={() => setOnglet('bar_resto')}
            className={`rounded-2xl px-4 py-2 text-sm font-medium ${
              onglet === 'bar_resto' ? 'bg-vert-700 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Bar, restaurant et place de fêtes
          </button>
        </div>
      )}

      <div className="relative mb-4 w-full max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full rounded border border-slate-300 py-2 pr-3 pl-9 text-sm focus:border-or-400 focus:outline-none"
          placeholder="Rechercher un mouvement..."
          value={recherche}
          onChange={(event) => setRecherche(event.target.value)}
        />
      </div>

      {onglet === 'ventes' && (
        <>
          <SectionMouvements types={TYPES_VENTES} nomsProduits={nomsProduits} recherche={recherche} />
          <SectionEncaissements nomsClients={nomsClients} />
        </>
      )}

      {onglet === 'bar_resto' && (
        <>
          <SectionMouvements types={TYPES_BAR_RESTO} nomsProduits={nomsProduits} recherche={recherche} />
          <SectionReservations nomsPdv={nomsPdv} />
        </>
      )}
    </Layout>
  )
}
