import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logoNativite from '../assets/logo-nativite.png'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setErreur('')
    setEnCours(true)
    try {
      await login(username, password)
      navigate('/')
    } catch {
      setErreur('Identifiants incorrects.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-full max-w-md flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900 p-10 text-center text-white lg:flex">
        <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-or-400/10" />
        <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-20 h-40 w-40 rounded-full bg-or-400/10" />
        <img
          src={logoNativite}
          alt="La Nativité"
          className="relative mb-6 w-36 rounded-full ring-4 ring-or-400/40"
        />
        <h1 className="relative text-2xl font-semibold">La Nativité</h1>
        <p className="relative mt-3 max-w-xs text-sm text-neutral-300">
          Suivi des dépôts-ventes, des stocks et des créances des commerciaux.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-slate-50 px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-10 shadow-sm"
        >
          <img src={logoNativite} alt="" className="mx-auto mb-6 w-16 lg:hidden" />

          <h2 className="mb-1 text-xl font-semibold text-slate-900">Connexion</h2>
          <p className="mb-6 text-sm text-slate-500">
            Accédez à votre tableau de bord de gestion.
          </p>

          <label className="mb-1 block text-sm font-medium text-slate-700">
            Nom d'utilisateur
          </label>
          <input
            className="mb-4 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none focus:ring-1 focus:ring-or-400"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />

          <label className="mb-1 block text-sm font-medium text-slate-700">Mot de passe</label>
          <input
            type="password"
            className="mb-4 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none focus:ring-1 focus:ring-or-400"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {erreur && <p className="mb-4 text-sm text-red-600">{erreur}</p>}

          <button
            type="submit"
            disabled={enCours}
            className="w-full rounded bg-or-500 py-2 text-sm font-medium text-white hover:bg-or-600 disabled:opacity-50"
          >
            {enCours ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
