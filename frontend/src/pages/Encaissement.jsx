import { useState } from 'react'
import { listerClients, listerCommerciaux } from '../api/ressources'
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
        <h1 className="mb-6 text-xl font-semibold text-slate-900">Encaissement</h1>
        <p className="mb-6 text-sm text-slate-500">
          Diminue le solde financier du client. Si un commercial a physiquement collecté l'argent,
          son propre solde financier augmente d'autant, en attendant la remise à la société.
        </p>

        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              required
            >
              <option value="" disabled>
                Client
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nom}
                </option>
              ))}
            </select>

            <select
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
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

            <select
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              value={collectePar}
              onChange={(event) => setCollectePar(event.target.value)}
            >
              <option value="">Collecté par (optionnel)</option>
              {commerciaux.map((commercial) => (
                <option key={commercial.id} value={commercial.id}>
                  {commercial.prenom} {commercial.nom}
                </option>
              ))}
            </select>

            <input
              type="number"
              step="0.01"
              min="0.01"
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="Montant"
              value={montant}
              onChange={(event) => setMontant(event.target.value)}
              required
            />
          </div>

          {succes && <p className="mb-3 text-sm text-green-600">{succes}</p>}

          <button
            type="submit"
            disabled={enCours}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {enCours ? 'Enregistrement...' : 'Enregistrer l\'encaissement'}
          </button>
        </form>
    </Layout>
  )
}
