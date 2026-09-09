import { Cloud, CloudOff, RefreshCw } from 'lucide-react'
import EnTeteBandeau from '../components/EnTeteBandeau'
import Layout from '../components/Layout'
import { reessayer, supprimerDeLaFile, synchroniser } from '../offline/sync'
import { useFileAttente } from '../offline/useFileAttente'

const LIBELLES_ENDPOINT = {
  '/mouvements-stock/': 'Mouvement de stock',
  '/encaissements/': 'Encaissement',
  '/clients/': 'Client',
}

export default function FileAttente() {
  const entrees = useFileAttente()
  const enAttente = entrees.filter((e) => e.statut === 'en_attente').length
  const echecs = entrees.filter((e) => e.statut === 'echec').length
  const toutSynchronise = entrees.length === 0

  return (
    <Layout>
      <EnTeteBandeau
        titre="Synchronisation"
        sousTitre="Synchronisez vos données avec le serveur"
        icone={RefreshCw}
      />

      <div className="mb-6 flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-white p-8 text-center">
        {toutSynchronise ? (
          <Cloud className="h-10 w-10 text-green-500" />
        ) : (
          <CloudOff className="h-10 w-10 text-amber-500" />
        )}
        <p className="text-lg font-semibold text-slate-900">
          {toutSynchronise ? 'Données à jour' : `${enAttente + echecs} en attente`}
        </p>
        <p className="text-sm text-slate-500">
          {toutSynchronise
            ? 'Votre application est entièrement synchronisée.'
            : `${enAttente} en attente de réseau, ${echecs} en échec.`}
        </p>
        <button
          onClick={synchroniser}
          className="mt-2 rounded bg-or-500 px-4 py-2 text-sm font-medium text-white hover:bg-or-600"
        >
          Synchroniser maintenant
        </button>
      </div>

      {entrees.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <ul className="divide-y divide-slate-100 text-sm">
            {entrees.map((entree) => (
              <li key={entree.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-800">{LIBELLES_ENDPOINT[entree.endpoint] ?? entree.endpoint}</p>
                  <p className="text-slate-500">{new Date(entree.createdAt).toLocaleString('fr-FR')}</p>
                  {entree.statut === 'echec' && <p className="mt-1 text-red-600">Échec : {entree.erreur}</p>}
                </div>
                <div className="flex items-center gap-3">
                  {entree.statut === 'en_attente' ? (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
                      En attente de réseau
                    </span>
                  ) : (
                    <>
                      <button onClick={() => reessayer(entree.id)} className="text-or-600 underline hover:text-or-700">
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
        </div>
      )}
    </Layout>
  )
}
