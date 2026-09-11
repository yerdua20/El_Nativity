import { History, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { listerClients, listerEncaissements, listerMouvements, listerProduits } from '../api/ressources'
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

export default function Historique() {
  const mouvements = useListePaginee(listerMouvements)
  const encaissements = useListePaginee(listerEncaissements)
  const nomsClients = useNoms(listerClients)
  const nomsProduits = useNoms(listerProduits)
  const [recherche, setRecherche] = useState('')

  const mouvementsFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase()
    if (!terme) return mouvements.resultats
    return mouvements.resultats.filter((m) => {
      const texte = `${LIBELLES_TYPE[m.type] ?? m.type} ${nomsProduits[m.produit] ?? ''}`.toLowerCase()
      return texte.includes(terme)
    })
  }, [mouvements.resultats, recherche, nomsProduits])

  return (
    <Layout>
      <EnTeteBandeau titre="Historique" sousTitre="Consultez l'historique de toutes les opérations" icone={History} />

      <div className="relative mb-4 w-full max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full rounded border border-slate-300 py-2 pr-3 pl-9 text-sm focus:border-or-400 focus:outline-none"
          placeholder="Rechercher une opération..."
          value={recherche}
          onChange={(event) => setRecherche(event.target.value)}
        />
      </div>

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
    </Layout>
  )
}
