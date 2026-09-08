import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import Nav from '../components/Nav'

export default function Dashboard() {
  const [sante, setSante] = useState('...')

  useEffect(() => {
    apiClient
      .get('/sante/')
      .then(({ data }) => setSante(data.status))
      .catch(() => setSante('indisponible'))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-6 text-xl font-semibold text-slate-900">Tableau de bord</h1>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <span className="font-medium text-slate-700">API : </span>
          <span className={sante === 'ok' ? 'text-green-600' : 'text-red-600'}>{sante}</span>
        </div>
      </div>
    </div>
  )
}
