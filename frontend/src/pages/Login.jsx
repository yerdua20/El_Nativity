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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-lg border border-slate-200 text-lg text-slate-500 italic items-center bg-white p-10 shadow-sm"
      >
        <p className="mb-6">
          Bienvenue dans l'espace de gestion des affaires de la Nativité. Veuillez vous connecter
          pour accéder à votre tableau de bord.
        </p>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Nom d'utilisateur
        </label>
        <input
          className="mb-4 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          required
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">Mot de passe</label>
        <input
          type="password"
          className="mb-4 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        {erreur && <p className="mb-4 text-sm text-red-600">{erreur}</p>}

        <button
          type="submit"
          disabled={enCours}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-gold-50 focus:outline-none focus:ring-2 focus:ring-or-400 focus:ring-offset-2"
        >
          {enCours ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
