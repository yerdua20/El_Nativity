import { Boxes } from 'lucide-react'
import { useMemo, useState } from 'react'
import { listerPointsDeVente, listerProduits, listerStockPointsDeVente } from '../api/ressources'
import EnTeteBandeau from '../components/EnTeteBandeau'
import Layout from '../components/Layout'
import { useRessource } from '../hooks/useRessource'

export default function Stock() {
  const pointsDeVente = useRessource(listerPointsDeVente, 'cache_points_de_vente')
  const produits = useRessource(listerProduits, 'cache_produits')
  const stock = useRessource(listerStockPointsDeVente, 'cache_stock_points_de_vente')
  const [pointDeVenteId, setPointDeVenteId] = useState('')

  const stockFiltre = useMemo(() => {
    if (!pointDeVenteId) return stock
    return stock.filter((ligne) => String(ligne.point_de_vente) === pointDeVenteId)
  }, [stock, pointDeVenteId])

  const nomsPdv = useMemo(() => Object.fromEntries(pointsDeVente.map((p) => [p.id, p.nom])), [pointsDeVente])
  const nomsProduits = useMemo(() => Object.fromEntries(produits.map((p) => [p.id, p.nom])), [produits])

  return (
    <Layout>
      <EnTeteBandeau
        titre="Stock"
        sousTitre="Quantité disponible par point de vente et par produit"
        icone={Boxes}
      />

      <div className="mb-4 w-full max-w-xs">
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

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {stockFiltre.length === 0 && <p className="p-4 text-sm text-slate-500">Aucun stock enregistré.</p>}
        {stockFiltre.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-4 py-3 font-medium">Point de vente</th>
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="px-4 py-3 font-medium">Quantité en stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockFiltre.map((ligne) => (
                <tr key={ligne.id}>
                  <td className="px-4 py-3">{nomsPdv[ligne.point_de_vente] ?? ligne.point_de_vente}</td>
                  <td className="px-4 py-3">{nomsProduits[ligne.produit] ?? ligne.produit}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{ligne.quantite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
