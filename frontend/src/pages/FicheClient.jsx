import { User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { lireClient, lireStockClient, listerEncaissements, listerMouvements, listerProduits } from '../api/ressources'
import EnTeteBandeau from '../components/EnTeteBandeau'
import Layout from '../components/Layout'
import { useRessource } from '../hooks/useRessource'

export default function FicheClient() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [mouvements, setMouvements] = useState([])
  const [encaissements, setEncaissements] = useState([])
  const [stockDetail, setStockDetail] = useState([])
  const produits = useRessource(listerProduits, 'cache_produits')
  const nomsProduits = Object.fromEntries(produits.map((p) => [p.id, p.nom]))

  useEffect(() => {
    lireClient(id).then(setClient)
    listerMouvements(`/mouvements-stock/?client=${id}`).then((data) => setMouvements(data.results))
    listerEncaissements(`/encaissements/?client=${id}`).then((data) => setEncaissements(data.results))
    lireStockClient(id).then(setStockDetail)
  }, [id])

  if (!client) {
    return (
      <Layout>
        <p className="text-sm text-slate-500">Chargement...</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <Link to="/clients" className="mb-4 inline-block text-sm text-slate-500 underline hover:text-slate-700">
        ← Retour aux clients
      </Link>

      <EnTeteBandeau
        titre={client.nom}
        sousTitre={[client.telephone, client.adresse].filter(Boolean).join(' · ') || 'Aucune information de contact'}
        icone={User}
      />

      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Solde marchandise</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{client.solde_marchandise}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Solde financier</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{client.solde_financier}</p>
        </div>
      </div>

      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Marchandise détenue par produit</h2>
        {stockDetail.length === 0 && (
          <p className="text-sm text-slate-500">Aucune marchandise en cours chez ce client.</p>
        )}
        {stockDetail.length > 0 && (
          <ul className="divide-y divide-slate-100 text-sm">
            {stockDetail.map((ligne) => (
              <li key={ligne.produit} className="flex justify-between py-2">
                <span>{ligne.produit_nom}</span>
                <span className="font-medium text-slate-900">{ligne.quantite_restante}</span>
              </li>
            ))}
          </ul>
        )}
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
                <span className="text-slate-500">{new Date(mouvement.date_mouvement).toLocaleDateString('fr-FR')}</span>
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
    </Layout>
  )
}
