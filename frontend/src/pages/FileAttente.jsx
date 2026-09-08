import Layout from '../components/Layout'
import { useFileAttente } from '../offline/useFileAttente'
import { reessayer, supprimerDeLaFile, synchroniser } from '../offline/sync'

const LIBELLES_ENDPOINT = {
  '/mouvements-stock/': 'Mouvement de stock',
  '/encaissements/': 'Encaissement',
  '/clients/': 'Client',
}

export default function FileAttente() {
  const entrees = useFileAttente()

  return (
    <Layout>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Synchronisation</h1>
          <button
            onClick={synchroniser}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            Resynchroniser maintenant
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          {entrees.length === 0 && (
            <p className="text-sm text-slate-500">Rien en attente, tout est synchronisé.</p>
          )}
          {entrees.length > 0 && (
            <ul className="divide-y divide-slate-100 text-sm">
              {entrees.map((entree) => (
                <li key={entree.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {LIBELLES_ENDPOINT[entree.endpoint] ?? entree.endpoint}
                    </p>
                    <p className="text-slate-500">
                      {new Date(entree.createdAt).toLocaleString('fr-FR')}
                    </p>
                    {entree.statut === 'echec' && (
                      <p className="mt-1 text-red-600">Échec : {entree.erreur}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {entree.statut === 'en_attente' ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
                        En attente de réseau
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => reessayer(entree.id)}
                          className="text-slate-600 underline hover:text-slate-900"
                        >
                          Réessayer
                        </button>
                        <button
                          onClick={() => supprimerDeLaFile(entree.id)}
                          className="text-red-600 underline hover:text-red-800"
                        >
                          Supprimer
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
    </Layout>
  )
}
