import { CreditCard } from 'lucide-react'
import { useState } from 'react'
import { listerClients, listerCommerciaux } from '../api/ressources'
import EnTeteBandeau from '../components/EnTeteBandeau'
import Layout from '../components/Layout'
import { useRessource } from '../hooks/useRessource'
import { mettreEnFile } from '../offline/sync'

const MOYENS_PAIEMENT = [
  { valeur: 'ESPECES', libelle: 'Espèces' },
  { valeur: 'MOBILE_MONEY', libelle: 'Mobile money' },
  { valeur: 'VIREMENT', libelle: 'Virement' },
  { valeur: 'AUTRE', libelle: 'Autre' },
]

export default function Encaissement() {
  const clients = useRessource(listerClients, 'cache_clients')
  const commerciaux = useRessource(listerCommerciaux, 'cache_commerciaux')

  const [clientId, setClientId] = useState('')
  const [montant, setMontant] = useState('')
  const [moyenPaiement, setMoyenPaiement] = useState('ESPECES')
  const [collectePar, setCollectePar] = useState('')
  const [succes, setSucces] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSucces('')
    setEnCours(true)
    await mettreEnFile({
      endpoint: '/encaissements/',
      payload: {
        uuid: crypto.randomUUID(),
        client: clientId,
        montant,
        moyen_paiement: moyenPaiement,
        collecte_par: collectePar || undefined,
        date_encaissement: new Date().toISOString(),
      },
    })
    setSucces('Encaissement enregistré (synchronisation en cours ou en attente de réseau).')
    setMontant('')
    setEnCours(false)
  }

  return (
    <Layout>
      <EnTeteBandeau titre="Encaissement" sousTitre="Enregistrer un paiement d'un client" icone={CreditCard} />
      <p className="mb-4 text-sm text-slate-500">
        Diminue le solde financier du client. Si un commercial a physiquement collecté l'argent, son
        propre solde financier augmente d'autant, en attendant la remise à la société.
      </p>

      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Client</label>
            <select
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              required
            >
              <option value="" disabled>
                Choisir un client
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mode de paiement</label>
            <select
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              value={moyenPaiement}
              onChange={(event) => setMoyenPaiement(event.target.value)}
              required
            >
              {MOYENS_PAIEMENT.map((moyen) => (
                <option key={moyen.valeur} value={moyen.valeur}>
                  {moyen.libelle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Collecté par (optionnel)</label>
            <select
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              value={collectePar}
              onChange={(event) => setCollectePar(event.target.value)}
            >
              <option value="">Aucun</option>
              {commerciaux.map((commercial) => (
                <option key={commercial.id} value={commercial.id}>
                  {commercial.prenom} {commercial.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Montant</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
              value={montant}
              onChange={(event) => setMontant(event.target.value)}
              required
            />
          </div>
        </div>

        {succes && <p className="mb-3 text-sm text-green-600">{succes}</p>}

        <button
          type="submit"
          disabled={enCours}
          className="rounded-2xl bg-or-500 px-4 py-2 text-sm font-medium text-white hover:bg-or-600 disabled:opacity-50"
        >
          {enCours ? 'Enregistrement...' : "Enregistrer l'encaissement"}
        </button>
      </form>
    </Layout>
  )
}
