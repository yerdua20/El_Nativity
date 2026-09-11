import { Boxes, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { listerPointsDeVente, listerProduits, listerStockPointsDeVente } from '../api/ressources'
import EnTeteBandeau from '../components/EnTeteBandeau'
import Layout from '../components/Layout'
import { useRessource } from '../hooks/useRessource'
import { mettreEnFile } from '../offline/sync'

export default function Stock() {
  const pointsDeVente = useRessource(listerPointsDeVente, 'cache_points_de_vente')
  const produits = useRessource(listerProduits, 'cache_produits')
  const [stock, setStock] = useState([])
  const [pointDeVenteId, setPointDeVenteId] = useState('')
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)

  const [receptionPdvId, setReceptionPdvId] = useState('')
  const [receptionProduitId, setReceptionProduitId] = useState('')
  const [quantite, setQuantite] = useState('')
  const [succes, setSucces] = useState('')
  const [enCours, setEnCours] = useState(false)

  function rafraichir() {
    listerStockPointsDeVente().then(setStock)
  }

  useEffect(rafraichir, [])

  const stockFiltre = useMemo(() => {
    if (!pointDeVenteId) return stock
    return stock.filter((ligne) => String(ligne.point_de_vente) === pointDeVenteId)
  }, [stock, pointDeVenteId])

  const nomsPdv = useMemo(() => Object.fromEntries(pointsDeVente.map((p) => [p.id, p.nom])), [pointsDeVente])
  const nomsProduits = useMemo(() => Object.fromEntries(produits.map((p) => [p.id, p.nom])), [produits])

  async function handleSubmit(event) {
    event.preventDefault()
    setSucces('')
    setEnCours(true)
    await mettreEnFile({
      endpoint: '/mouvements-stock/',
      payload: {
        uuid: crypto.randomUUID(),
        type: 'ENTREE_DEPOT',
        produit: receptionProduitId,
        quantite,
        point_de_vente: receptionPdvId,
        date_mouvement: new Date().toISOString(),
      },
    })
    setSucces('Réception enregistrée (synchronisation en cours ou en attente de réseau).')
    setQuantite('')
    setEnCours(false)
    rafraichir()
  }

  return (
    <Layout>
      <EnTeteBandeau
        titre="Stock"
        sousTitre="Quantité disponible par point de vente et par produit"
        icone={Boxes}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="w-full max-w-xs">
          <select
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
            value={pointDeVenteId}
            onChange={(event) => setPointDeVenteId(event.target.value)}
          >
            <option value="">Tous les points de vente</option>
            {pointsDeVente.map((pdv) => (
              <option key={pdv.id} value={pdv.id}>
                {pdv.nom}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setFormulaireOuvert((v) => !v)}
          className="flex items-center gap-1.5 rounded-2xl bg-or-500 px-3 py-2 text-sm font-medium text-white hover:bg-or-600"
        >
          <Plus className="h-4 w-4" />
          Nouvelle réception
        </button>
      </div>

      {formulaireOuvert && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              value={receptionPdvId}
              onChange={(event) => setReceptionPdvId(event.target.value)}
              required
            >
              <option value="" disabled>
                Point de vente
              </option>
              {pointsDeVente.map((pdv) => (
                <option key={pdv.id} value={pdv.id}>
                  {pdv.nom}
                </option>
              ))}
            </select>
            <select
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              value={receptionProduitId}
              onChange={(event) => setReceptionProduitId(event.target.value)}
              required
            >
              <option value="" disabled>
                Produit
              </option>
              {produits.map((produit) => (
                <option key={produit.id} value={produit.id}>
                  {produit.nom}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Quantité reçue"
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              value={quantite}
              onChange={(event) => setQuantite(event.target.value)}
              required
            />
          </div>

          {succes && <p className="mt-3 text-sm text-green-600">{succes}</p>}
          <button
            type="submit"
            disabled={enCours}
            className="mt-3 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {enCours ? 'Enregistrement...' : 'Enregistrer la réception'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {stockFiltre.length === 0 && <p className="p-4 text-sm text-slate-500">Aucun stock enregistré.</p>}
        {stockFiltre.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-4 py-3 font-medium">Point de vente</th>
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="px-4 py-3 font-medium">Quantité en stock</th>
                <th className="px-4 py-3 font-medium">Vendu (total)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockFiltre.map((ligne) => (
                <tr key={ligne.id}>
                  <td className="px-4 py-3">{nomsPdv[ligne.point_de_vente] ?? ligne.point_de_vente}</td>
                  <td className="px-4 py-3">{nomsProduits[ligne.produit] ?? ligne.produit}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{ligne.quantite}</td>
                  <td className="px-4 py-3 text-slate-500">{ligne.quantite_vendue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
