import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import { useAuth } from '../auth/AuthContext'

export default function Dashboard() {
  const { logout } = useAuth()
  const [sante, setSante] = useState('...')
  const [clients, setClients] = useState(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    apiClient
      .get('/sante/')
      .then(({ data }) => setSante(data.status))
      .catch(() => setSante('indisponible'))

    apiClient
      .get('/clients/')
      .then(({ data }) => setClients(data.results))
      .catch(() => setErreur("Impossible de charger les clients."))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Gestion d'affaires</h1>
          <button
            onClick={logout}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            Déconnexion
          </button>
        </div>

        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <span className="font-medium text-slate-700">API : </span>
          <span className={sante === 'ok' ? 'text-green-600' : 'text-red-600'}>{sante}</span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Clients</h2>
          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
          {!erreur && !clients && <p className="text-sm text-slate-500">Chargement...</p>}
          {clients && clients.length === 0 && (
            <p className="text-sm text-slate-500">Aucun client pour l'instant.</p>
          )}
          {clients && clients.length > 0 && (
            <ul className="divide-y divide-slate-100 text-sm">
              {clients.map((client) => (
                <li key={client.id} className="flex justify-between py-2">
                  <span>{client.nom}</span>
                  <span className="text-slate-500">
                    Marchandise : {client.solde_marchandise} · Financier : {client.solde_financier}
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
