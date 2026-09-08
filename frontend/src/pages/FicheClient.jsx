import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { lireClient, listerEncaissements, listerMouvements, listerProduits } from '../api/ressources'
import Nav from '../components/Nav'
import { useRessource } from '../hooks/useRessource'

export default function FicheClient() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [mouvements, setMouvements] = useState([])
  const [encaissements, setEncaissements] = useState([])
  const produits = useRessource(listerProduits, 'cache_produits')
  const nomsProduits = Object.fromEntries(produits.map((p) => [p.id, p.nom]))

  useEffect(() => {
    lireClient(id).then(setClient)
    listerMouvements(`/mouvements-stock/?client=${id}`).then((data) => setMouvements(data.results))
    listerEncaissements(`/encaissements/?client=${id}`).then((data) => setEncaissements(data.results))
  }, [id])

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Nav />
        <div className="mx-auto max-w-4xl px-6 py-8 text-sm text-slate-500">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Link to="/clients" className="mb-4 inline-block text-sm text-slate-500 underline hover:text-slate-700">
          ← Retour aux clients
        </Link>

        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <h1 className="text-xl font-semibold text-slate-900">{client.nom}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {client.telephone && <>{client.telephone} · </>}
            {client.adresse || 'Adresse non renseignée'}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded bg-slate-50 p-3">
              <p className="text-slate-500">Solde marchandise</p>
              <p className="text-lg font-semibold text-slate-900">{client.solde_marchandise}</p>
            </div>
            <div className="rounded bg-slate-50 p-3">
              <p className="text-slate-500">Solde financier</p>
              <p className="text-lg font-semibold text-slate-900">{client.solde_financier}</p>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Mouvements de stock</h2>
          {mouvements.length === 0 && <p className="text-sm text-slate-500">Aucun mouvement.</p>}
          {mouvements.length > 0 && (
            <ul className="divide-y divide-slate-100 text-sm">
              {mouvements.map((mouvement) => (
                <li key={mouvement.id} className="flex justify-between py-2">
                  <span>
                    {mouvement.type} — {nomsProduits[mouvement.produit] ?? mouvement.produit} x
                    {mouvement.quantite}
                  </span>
                  <span className="text-slate-500">
                    {new Date(mouvement.date_mouvement).toLocaleDateString('fr-FR')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Encaissements</h2>
          {encaissements.length === 0 && <p className="text-sm text-slate-500">Aucun encaissement.</p>}
          {encaissements.length > 0 && (
            <ul className="divide-y divide-slate-100 text-sm">
              {encaissements.map((encaissement) => (
                <li key={encaissement.id} className="flex justify-between py-2">
                  <span>
                    {encaissement.montant} ({encaissement.moyen_paiement})
                  </span>
                  <span className="text-slate-500">
                    {new Date(encaissement.date_encaissement).toLocaleDateString('fr-FR')}
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
