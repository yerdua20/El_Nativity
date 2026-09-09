import { Briefcase, Lock, Mail, Settings as IconSettings, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import { changerMotDePasse, lireMoi, listerCommerciaux, listerPointsDeVente, modifierMoi } from '../api/ressources'
import Layout from '../components/Layout'

function ChampIcone({ icon: Icon, className = '', ...props }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        {...props}
        className={`w-full rounded border border-slate-300 py-2 pr-3 pl-9 text-sm focus:border-or-400 focus:outline-none ${className}`}
      />
    </div>
  )
}

function OngletCompte({ moi, setMoi }) {
  const [email, setEmail] = useState(moi.email)
  const [succes, setSucces] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

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

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Informations du compte</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nom d'utilisateur</label>
          <ChampIcone icon={User} value={moi.username} disabled className="bg-slate-50 text-slate-500" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <ChampIcone
            icon={Mail}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
      </div>

      {erreur && <p className="mt-4 text-sm text-red-600">{erreur}</p>}
      {succes && <p className="mt-4 text-sm text-green-600">{succes}</p>}

      <button
        type="submit"
        disabled={enCours}
        className="mt-6 rounded bg-or-500 px-4 py-2 text-sm font-medium text-white hover:bg-or-600 disabled:opacity-50"
      >
        {enCours ? 'Enregistrement...' : 'Enregistrer les modifications'}
      </button>
    </form>
  )
}

function OngletSecurite() {
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
    <form onSubmit={handleSubmit}>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Mot de passe</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Mot de passe actuel</label>
          <ChampIcone
            icon={Lock}
            type="password"
            value={ancien}
            onChange={(event) => setAncien(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
          <ChampIcone
            icon={Lock}
            type="password"
            value={nouveau}
            onChange={(event) => setNouveau(event.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Confirmer</label>
          <ChampIcone
            icon={Lock}
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
      </div>

      {erreur && <p className="mt-4 text-sm text-red-600">{erreur}</p>}
      {succes && <p className="mt-4 text-sm text-green-600">{succes}</p>}

      <button
        type="submit"
        disabled={enCours}
        className="mt-6 rounded bg-or-500 px-4 py-2 text-sm font-medium text-white hover:bg-or-600 disabled:opacity-50"
      >
        {enCours ? 'Enregistrement...' : 'Changer le mot de passe'}
      </button>
    </form>
  )
}

function OngletCommercial({ commercial }) {
  const [pointsDeVente, setPointsDeVente] = useState([])

  useEffect(() => {
    listerPointsDeVente().then(setPointsDeVente)
  }, [])

  const nomPdv = pointsDeVente.find((p) => p.id === commercial.point_de_vente)?.nom

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Fiche commercial</h2>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-slate-500">Nom</dt>
          <dd className="font-medium text-slate-900">
            {commercial.prenom} {commercial.nom}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Dépôt de rattachement</dt>
          <dd className="font-medium text-slate-900">{nomPdv ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Solde marchandise</dt>
          <dd className="font-medium text-slate-900">{commercial.solde_marchandise}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Solde financier</dt>
          <dd className="font-medium text-slate-900">{commercial.solde_financier}</dd>
        </div>
      </dl>
    </div>
  )
}

export default function Profil() {
  const [sante, setSante] = useState('...')
  const [moi, setMoi] = useState(null)
  const [commercial, setCommercial] = useState(undefined)
  const [ongletActif, setOngletActif] = useState('compte')

  useEffect(() => {
    apiClient
      .get('/sante/')
      .then(({ data }) => setSante(data.status))
      .catch(() => setSante('indisponible'))
    lireMoi().then(setMoi)
    listerCommerciaux().then((liste) => setCommercial(liste[0] ?? null))
  }, [])

  const onglets = [
    { id: 'compte', label: 'Compte', icon: User },
    { id: 'securite', label: 'Sécurité', icon: Lock },
    ...(commercial ? [{ id: 'commercial', label: 'Commercial', icon: Briefcase }] : []),
  ]

  return (
    <Layout>
      <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-br from-neutral-700 to-neutral-600 px-6 py-8 text-white shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(206,154,46,0.35)_1.5px,transparent_1.5px)] bg-[length:22px_22px]" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(206,154,46,0.08)_0px,rgba(206,154,46,0.08)_2px,transparent_2px,transparent_18px)]" />
        <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full border-2 border-or-400/25" />
        <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-or-400/10" />
        <div className="absolute -bottom-16 -right-24 h-56 w-56 rounded-full border-2 border-or-400/20" />
        <div className="absolute -bottom-16 -right-24 h-56 w-56 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
            <IconSettings className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Paramètres</h1>
            <p className="text-sm text-neutral-300">Gérez votre compte et vos accès</p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs">
            <span className={`h-1.5 w-1.5 rounded-full ${sante === 'ok' ? 'bg-or-300' : 'bg-red-400'}`} />
            API {sante === 'ok' ? 'connectée' : sante}
          </span>
        </div>
      </div>

      {!moi || commercial === undefined ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <>
          <div className="mb-6 flex gap-1 border-b border-slate-200">
            {onglets.map((onglet) => (
              <button
                key={onglet.id}
                onClick={() => setOngletActif(onglet.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                  ongletActif === onglet.id
                    ? 'border-or-500 text-or-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <onglet.icon className="h-4 w-4" />
                {onglet.label}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            {ongletActif === 'compte' && <OngletCompte moi={moi} setMoi={setMoi} />}
            {ongletActif === 'securite' && <OngletSecurite />}
            {ongletActif === 'commercial' && commercial && <OngletCommercial commercial={commercial} />}
          </div>
        </>
      )}
    </Layout>
  )
}
