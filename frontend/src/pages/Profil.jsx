import { useEffect, useState } from 'react'
import { changerMotDePasse, lireMoi, listerCommerciaux, listerPointsDeVente, modifierMoi } from '../api/ressources'
import Layout from '../components/Layout'

function SectionCompte() {
  const [moi, setMoi] = useState(null)
  const [email, setEmail] = useState('')
  const [succes, setSucces] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  useEffect(() => {
    lireMoi().then((data) => {
      setMoi(data)
      setEmail(data.email)
    })
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setSucces('')
    setErreur('')
    setEnCours(true)
    try {
      const data = await modifierMoi({ email })
      setMoi(data)
      setSucces('Email mis à jour.')
    } catch {
      setErreur("Impossible de mettre à jour l'email.")
    } finally {
      setEnCours(false)
    }
  }

  if (!moi) return <p className="text-sm text-slate-500">Chargement...</p>

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">Compte</h2>

      <label className="mb-1 block text-sm font-medium text-slate-700">Nom d'utilisateur</label>
      <input
        className="mb-4 w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500"
        value={moi.username}
        disabled
      />

      <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
      <input
        type="email"
        className="mb-4 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      {erreur && <p className="mb-3 text-sm text-red-600">{erreur}</p>}
      {succes && <p className="mb-3 text-sm text-green-600">{succes}</p>}

      <button
        type="submit"
        disabled={enCours}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {enCours ? 'Enregistrement...' : "Mettre à jour l'email"}
      </button>
    </form>
  )
}

function SectionMotDePasse() {
  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [succes, setSucces] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSucces('')
    setErreur('')
    if (nouveau !== confirmation) {
      setErreur('La confirmation ne correspond pas au nouveau mot de passe.')
      return
    }
    setEnCours(true)
    try {
      await changerMotDePasse({ ancien_mot_de_passe: ancien, nouveau_mot_de_passe: nouveau })
      setSucces('Mot de passe modifié.')
      setAncien('')
      setNouveau('')
      setConfirmation('')
    } catch (error) {
      const detail = error.response?.data?.detail
      setErreur(Array.isArray(detail) ? detail.join(' ') : detail || 'Impossible de changer le mot de passe.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">Mot de passe</h2>

      <label className="mb-1 block text-sm font-medium text-slate-700">Mot de passe actuel</label>
      <input
        type="password"
        className="mb-4 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
        value={ancien}
        onChange={(event) => setAncien(event.target.value)}
        autoComplete="current-password"
        required
      />

      <label className="mb-1 block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
      <input
        type="password"
        className="mb-4 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
        value={nouveau}
        onChange={(event) => setNouveau(event.target.value)}
        autoComplete="new-password"
        required
      />

      <label className="mb-1 block text-sm font-medium text-slate-700">Confirmer le nouveau mot de passe</label>
      <input
        type="password"
        className="mb-4 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        autoComplete="new-password"
        required
      />

      {erreur && <p className="mb-3 text-sm text-red-600">{erreur}</p>}
      {succes && <p className="mb-3 text-sm text-green-600">{succes}</p>}

      <button
        type="submit"
        disabled={enCours}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {enCours ? 'Enregistrement...' : 'Changer le mot de passe'}
      </button>
    </form>
  )
}

function SectionCommercial() {
  const [commercial, setCommercial] = useState(undefined)
  const [pointsDeVente, setPointsDeVente] = useState([])

  useEffect(() => {
    listerCommerciaux().then((liste) => setCommercial(liste[0] ?? null))
    listerPointsDeVente().then(setPointsDeVente)
  }, [])

  if (commercial === undefined) return null
  if (commercial === null) return null

  const nomPdv = pointsDeVente.find((p) => p.id === commercial.point_de_vente)?.nom

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">Fiche commercial</h2>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-slate-500">Nom</dt>
          <dd className="font-medium text-slate-900">
            {commercial.prenom} {commercial.nom}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Dépôt de rattachement</dt>
          <dd className="font-medium text-slate-900">{nomPdv ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Solde marchandise</dt>
          <dd className="font-medium text-slate-900">{commercial.solde_marchandise}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Solde financier</dt>
          <dd className="font-medium text-slate-900">{commercial.solde_financier}</dd>
        </div>
      </dl>
    </div>
  )
}

export default function Profil() {
  return (
    <Layout>
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Profil</h1>
      <div className="grid grid-cols-1 gap-6">
        <SectionCompte />
        <SectionMotDePasse />
        <SectionCommercial />
      </div>
    </Layout>
  )
}
