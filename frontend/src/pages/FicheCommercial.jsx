import { Briefcase } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { lireCommercial, listerClients } from '../api/ressources'
import EnTeteBandeau from '../components/EnTeteBandeau'
import Layout from '../components/Layout'

function Avatar({ nom }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-or-100 text-xs font-semibold text-or-700">
      {nom.slice(0, 2).toUpperCase()}
    </span>
  )
}

export default function FicheCommercial() {
  const { id } = useParams()
  const [commercial, setCommercial] = useState(null)
  const [marchands, setMarchands] = useState([])

  useEffect(() => {
    lireCommercial(id).then(setCommercial)
    listerClients().then((liste) =>
      setMarchands(liste.filter((c) => String(c.commercial) === id && c.mode_vente === 'DEPOT_VENTE')),
    )
  }, [id])

  if (!commercial) {
    return (
      <Layout>
        <p className="text-sm text-slate-500">Chargement...</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <Link to="/commerciaux" className="mb-4 inline-block text-sm text-slate-500 underline hover:text-slate-700">
        ← Retour aux commerciaux
      </Link>

      <EnTeteBandeau
        titre={`${commercial.prenom} ${commercial.nom}`}
        sousTitre={commercial.telephone || 'Aucun téléphone renseigné'}
        icone={Briefcase}
      />

      <p className="mb-4 text-sm text-slate-500">
        Marchands sur lesquels {commercial.prenom} est tagué comme responsable (audit uniquement,
        aucun solde propre).
      </p>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {marchands.length === 0 && <p className="p-4 text-sm text-slate-500">Aucun marchand pour l'instant.</p>}
        {marchands.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Téléphone</th>
                <th className="px-4 py-3 font-medium">Soldes</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {marchands.map((marchand) => (
                <tr key={marchand.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar nom={marchand.nom} />
                      {marchand.nom}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{marchand.telephone || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">
                    Marchandise : {marchand.solde_marchandise} · Financier : {marchand.solde_financier}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        marchand.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {marchand.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/clients/${marchand.id}`} className="text-or-600 underline hover:text-or-700">
                      Voir la fiche
                    </Link>
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
