import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
        className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm"
      >
        <h1 className="mb-6 text-xl font-semibold text-slate-900">Gestion d'affaires</h1>

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
          className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {enCours ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
