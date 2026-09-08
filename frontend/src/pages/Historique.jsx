import { useEffect, useState } from 'react'
import { listerClients, listerEncaissements, listerMouvements, listerProduits } from '../api/ressources'
import Layout from '../components/Layout'

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
        className="rounded border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
      >
        Précédent
      </button>
      <button
        onClick={suivant}
        disabled={!suivant}
        className="rounded border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
      >
        Suivant
      </button>
    </div>
  )
}

export default function Historique() {
  const mouvements = useListePaginee(listerMouvements)
  const encaissements = useListePaginee(listerEncaissements)
  const nomsClients = useNoms(listerClients)
  const nomsProduits = useNoms(listerProduits)

  return (
    <Layout>
        <h1 className="mb-6 text-xl font-semibold text-slate-900">Historique</h1>

        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Mouvements de stock ({mouvements.count})
          </h2>
          {mouvements.chargement && <p className="text-sm text-slate-500">Chargement...</p>}
          {!mouvements.chargement && mouvements.resultats.length === 0 && (
            <p className="text-sm text-slate-500">Aucun mouvement.</p>
          )}
          {mouvements.resultats.length > 0 && (
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
                  {mouvements.resultats.map((mouvement) => (
                    <tr key={mouvement.id}>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {new Date(mouvement.date_mouvement).toLocaleString('fr-FR')}
                      </td>
                      <td className="py-2 pr-3">{mouvement.type}</td>
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

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Encaissements ({encaissements.count})
          </h2>
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
    </Layout>
  )
}
