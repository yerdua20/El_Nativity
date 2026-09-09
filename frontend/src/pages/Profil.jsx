import {
  Briefcase,
  Building2,
  Coins,
  Database,
  Download,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Settings as IconSettings,
  Shield,
  Trash2,
  User,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import {
  changerMotDePasse,
  creerUtilisateur,
  exporterCSV,
  lireEntreprise,
  lireMoi,
  listerCommerciaux,
  listerPointsDeVente,
  listerUtilisateurs,
  modifierEntreprise,
  modifierMoi,
  modifierUtilisateur,
  supprimerUtilisateur,
} from '../api/ressources'
import Layout from '../components/Layout'

function ChampIcone({ icon: Icon, className = '', ...props }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        {...props}
        className={`w-full rounded border border-slate-300 py-2 pr-3 pl-9 text-sm focus:border-or-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 ${className}`}
      />
    </div>
  )
}

function Interrupteur({ actif, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      disabled={disabled}
      onClick={() => onChange(!actif)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
        actif ? 'bg-or-500' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
          actif ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

function Bouton({ children, ...props }) {
  return (
    <button
      {...props}
      className="rounded bg-or-500 px-4 py-2 text-sm font-medium text-white hover:bg-or-600 disabled:opacity-50"
    >
      {children}
    </button>
  )
}

// --- Onglet Compte : infos personnelles + mot de passe personnel -------

function OngletCompte({ moi, setMoi }) {
  const [email, setEmail] = useState(moi.email)
  const [succesEmail, setSuccesEmail] = useState('')
  const [erreurEmail, setErreurEmail] = useState('')
  const [enCoursEmail, setEnCoursEmail] = useState(false)

  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [succesMdp, setSuccesMdp] = useState('')
  const [erreurMdp, setErreurMdp] = useState('')
  const [enCoursMdp, setEnCoursMdp] = useState(false)

  async function handleSubmitEmail(event) {
    event.preventDefault()
    setSuccesEmail('')
    setErreurEmail('')
    setEnCoursEmail(true)
    try {
      const data = await modifierMoi({ email })
      setMoi(data)
      setSuccesEmail('Email mis à jour.')
    } catch {
      setErreurEmail("Impossible de mettre à jour l'email.")
    } finally {
      setEnCoursEmail(false)
    }
  }

  async function handleSubmitMdp(event) {
    event.preventDefault()
    setSuccesMdp('')
    setErreurMdp('')
    if (nouveau !== confirmation) {
      setErreurMdp('La confirmation ne correspond pas au nouveau mot de passe.')
      return
    }
    setEnCoursMdp(true)
    try {
      await changerMotDePasse({ ancien_mot_de_passe: ancien, nouveau_mot_de_passe: nouveau })
      setSuccesMdp('Mot de passe modifié.')
      setAncien('')
      setNouveau('')
      setConfirmation('')
    } catch (error) {
      const detail = error.response?.data?.detail
      setErreurMdp(Array.isArray(detail) ? detail.join(' ') : detail || 'Impossible de changer le mot de passe.')
    } finally {
      setEnCoursMdp(false)
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmitEmail}>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Informations du compte</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nom d'utilisateur</label>
            <ChampIcone icon={User} value={moi.username} disabled />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <ChampIcone icon={Mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        {erreurEmail && <p className="mt-3 text-sm text-red-600">{erreurEmail}</p>}
        {succesEmail && <p className="mt-3 text-sm text-green-600">{succesEmail}</p>}
        <Bouton type="submit" disabled={enCoursEmail} className="mt-4">
          {enCoursEmail ? 'Enregistrement...' : "Mettre à jour l'email"}
        </Bouton>
      </form>

      <form onSubmit={handleSubmitMdp} className="border-t border-slate-200 pt-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Mot de passe</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Mot de passe actuel</label>
            <ChampIcone
              icon={Lock}
              type="password"
              value={ancien}
              onChange={(e) => setAncien(e.target.value)}
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
              onChange={(e) => setNouveau(e.target.value)}
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
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
        </div>
        {erreurMdp && <p className="mt-3 text-sm text-red-600">{erreurMdp}</p>}
        {succesMdp && <p className="mt-3 text-sm text-green-600">{succesMdp}</p>}
        <Bouton type="submit" disabled={enCoursMdp} className="mt-4">
          {enCoursMdp ? 'Enregistrement...' : 'Changer le mot de passe'}
        </Bouton>
      </form>
    </div>
  )
}

// --- Onglet Commercial (si le compte est lié) ---------------------------

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

// --- Onglet Général (staff) : infos de l'entreprise ----------------------

function OngletGeneral({ entreprise, setEntreprise }) {
  const [form, setForm] = useState(entreprise)
  const [succes, setSucces] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  function champ(nom) {
    return {
      value: form[nom],
      onChange: (event) => setForm({ ...form, [nom]: event.target.value }),
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSucces('')
    setErreur('')
    setEnCours(true)
    try {
      const data = await modifierEntreprise({
        nom: form.nom,
        email_contact: form.email_contact,
        telephone: form.telephone,
        adresse: form.adresse,
        devise: form.devise,
      })
      setEntreprise(data)
      setForm(data)
      setSucces('Informations enregistrées.')
    } catch {
      setErreur('Impossible d\'enregistrer les informations.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Informations générales</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nom de l'entreprise</label>
          <ChampIcone icon={Building2} {...champ('nom')} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email de contact</label>
          <ChampIcone icon={Mail} type="email" {...champ('email_contact')} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Téléphone</label>
          <ChampIcone icon={Phone} {...champ('telephone')} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Devise</label>
          <div className="relative">
            <Coins className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              {...champ('devise')}
              className="w-full appearance-none rounded border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm focus:border-or-400 focus:outline-none"
            >
              <option value="XOF">Franc CFA (XOF)</option>
              <option value="EUR">Euro</option>
              <option value="USD">Dollar US</option>
            </select>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Adresse</label>
          <ChampIcone icon={MapPin} {...champ('adresse')} />
        </div>
      </div>

      {erreur && <p className="mt-4 text-sm text-red-600">{erreur}</p>}
      {succes && <p className="mt-4 text-sm text-green-600">{succes}</p>}

      <Bouton type="submit" disabled={enCours} className="mt-6">
        {enCours ? 'Enregistrement...' : 'Enregistrer les modifications'}
      </Bouton>
    </form>
  )
}

// --- Onglet Utilisateurs (staff) -----------------------------------------

function LigneUtilisateur({ utilisateur, rafraichir }) {
  const [enCours, setEnCours] = useState(false)

  async function changerRole(isStaff) {
    setEnCours(true)
    await modifierUtilisateur(utilisateur.id, { is_staff: isStaff })
    await rafraichir()
    setEnCours(false)
  }

  async function changerStatut(actif) {
    setEnCours(true)
    await modifierUtilisateur(utilisateur.id, { is_active: actif })
    await rafraichir()
    setEnCours(false)
  }

  async function supprimer() {
    if (!window.confirm(`Supprimer le compte "${utilisateur.username}" ?`)) return
    setEnCours(true)
    try {
      await supprimerUtilisateur(utilisateur.id)
      await rafraichir()
    } catch (error) {
      window.alert(error.response?.data?.detail ?? 'Suppression impossible.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <tr className="border-b border-slate-100">
      <td className="py-3 pr-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-or-100 text-xs font-semibold text-or-700">
            {utilisateur.username.slice(0, 2).toUpperCase()}
          </span>
          {utilisateur.username}
        </div>
      </td>
      <td className="py-3 pr-3 text-slate-500">{utilisateur.email || '—'}</td>
      <td className="py-3 pr-3">
        <select
          value={utilisateur.is_staff ? 'admin' : 'user'}
          onChange={(event) => changerRole(event.target.value === 'admin')}
          disabled={enCours}
          className="rounded border border-slate-300 px-2 py-1 text-xs"
        >
          <option value="admin">Administrateur</option>
          <option value="user">Utilisateur</option>
        </select>
      </td>
      <td className="py-3 pr-3">
        <button
          onClick={() => changerStatut(!utilisateur.is_active)}
          disabled={enCours}
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            utilisateur.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {utilisateur.is_active ? 'Actif' : 'Inactif'}
        </button>
      </td>
      <td className="py-3 text-right">
        <button onClick={supprimer} disabled={enCours} className="text-red-500 hover:text-red-700">
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  )
}

function OngletUtilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState(null)
  const [ajoutOuvert, setAjoutOuvert] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  function rafraichir() {
    return listerUtilisateurs().then(setUtilisateurs)
  }

  useEffect(() => {
    rafraichir()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setErreur('')
    setEnCours(true)
    try {
      await creerUtilisateur({ username, email, password, is_staff: false, is_active: true })
      setUsername('')
      setEmail('')
      setPassword('')
      setAjoutOuvert(false)
      await rafraichir()
    } catch (error) {
      const data = error.response?.data
      setErreur(
        data ? Object.values(data).flat().join(' ') : "Impossible de créer l'utilisateur.",
      )
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Gestion des utilisateurs</h2>
        <button
          onClick={() => setAjoutOuvert((v) => !v)}
          className="flex items-center gap-1.5 rounded bg-or-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-or-600"
        >
          <Plus className="h-4 w-4" />
          Ajouter un utilisateur
        </button>
      </div>

      {ajoutOuvert && (
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 gap-3 rounded border border-slate-200 p-4 sm:grid-cols-3">
          <ChampIcone icon={User} placeholder="Nom d'utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <ChampIcone icon={Mail} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <ChampIcone icon={Lock} type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {erreur && <p className="text-sm text-red-600 sm:col-span-3">{erreur}</p>}
          <Bouton type="submit" disabled={enCours} className="sm:col-span-3">
            {enCours ? 'Création...' : 'Créer'}
          </Bouton>
        </form>
      )}

      {!utilisateurs && <p className="text-sm text-slate-500">Chargement...</p>}
      {utilisateurs && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3 font-medium">Nom</th>
                <th className="py-2 pr-3 font-medium">Email</th>
                <th className="py-2 pr-3 font-medium">Rôle</th>
                <th className="py-2 pr-3 font-medium">Statut</th>
                <th className="py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((u) => (
                <LigneUtilisateur key={u.id} utilisateur={u} rafraichir={rafraichir} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// --- Onglet Sécurité (staff) : politique de mot de passe -----------------

function OngletSecurite({ entreprise, setEntreprise }) {
  const [form, setForm] = useState(entreprise)
  const [succes, setSucces] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSucces('')
    setErreur('')
    setEnCours(true)
    try {
      const data = await modifierEntreprise({
        mdp_longueur_min: Number(form.mdp_longueur_min),
        mdp_exiger_majuscule: form.mdp_exiger_majuscule,
        mdp_exiger_chiffre: form.mdp_exiger_chiffre,
        mdp_exiger_caractere_special: form.mdp_exiger_caractere_special,
      })
      setEntreprise(data)
      setForm(data)
      setSucces('Politique de mot de passe enregistrée.')
    } catch {
      setErreur('Impossible d\'enregistrer les paramètres.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Shield className="h-5 w-5 text-or-500" />
        Politique de mot de passe
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        S'applique à tous les comptes : création d'utilisateur et changement de mot de passe.
      </p>

      <label className="mb-1 block text-sm font-medium text-slate-700">Longueur minimale</label>
      <input
        type="number"
        min="4"
        max="64"
        value={form.mdp_longueur_min}
        onChange={(event) => setForm({ ...form, mdp_longueur_min: event.target.value })}
        className="mb-6 w-32 rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-700">Exiger des majuscules</span>
          <Interrupteur
            actif={form.mdp_exiger_majuscule}
            onChange={(v) => setForm({ ...form, mdp_exiger_majuscule: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-700">Exiger des chiffres</span>
          <Interrupteur
            actif={form.mdp_exiger_chiffre}
            onChange={(v) => setForm({ ...form, mdp_exiger_chiffre: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-700">Exiger des caractères spéciaux</span>
          <Interrupteur
            actif={form.mdp_exiger_caractere_special}
            onChange={(v) => setForm({ ...form, mdp_exiger_caractere_special: v })}
          />
        </div>
      </div>

      {erreur && <p className="mt-4 text-sm text-red-600">{erreur}</p>}
      {succes && <p className="mt-4 text-sm text-green-600">{succes}</p>}

      <Bouton type="submit" disabled={enCours} className="mt-6">
        {enCours ? 'Enregistrement...' : 'Enregistrer les paramètres'}
      </Bouton>
    </form>
  )
}

// --- Onglet Données (staff) : export --------------------------------------

function OngletDonnees() {
  const [jeu, setJeu] = useState('clients')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState('')

  async function handleExport() {
    setErreur('')
    setEnCours(true)
    try {
      await exporterCSV(jeu)
    } catch {
      setErreur("Impossible d'exporter ces données.")
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Database className="h-5 w-5 text-or-500" />
        Exportation des données
      </h2>
      <p className="mb-4 text-sm text-slate-500">Télécharge un jeu de données au format CSV.</p>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Jeu de données</label>
          <select
            value={jeu}
            onChange={(event) => setJeu(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-or-400 focus:outline-none"
          >
            <option value="clients">Clients</option>
            <option value="commerciaux">Commerciaux</option>
            <option value="mouvements">Mouvements de stock</option>
            <option value="encaissements">Encaissements</option>
          </select>
        </div>
        <Bouton onClick={handleExport} disabled={enCours} type="button">
          <span className="flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            {enCours ? 'Export...' : 'Exporter'}
          </span>
        </Bouton>
      </div>
      {erreur && <p className="mt-4 text-sm text-red-600">{erreur}</p>}
    </div>
  )
}

// --- Page ------------------------------------------------------------------

export default function Profil() {
  const [sante, setSante] = useState('...')
  const [moi, setMoi] = useState(null)
  const [commercial, setCommercial] = useState(undefined)
  const [entreprise, setEntreprise] = useState(undefined)
  const [ongletActif, setOngletActif] = useState('compte')

  useEffect(() => {
    apiClient
      .get('/sante/')
      .then(({ data }) => setSante(data.status))
      .catch(() => setSante('indisponible'))
    lireMoi().then(setMoi)
    listerCommerciaux().then((liste) => setCommercial(liste[0] ?? null))
  }, [])

  useEffect(() => {
    if (moi?.is_staff) lireEntreprise().then(setEntreprise)
  }, [moi])

  if (!moi || commercial === undefined) {
    return (
      <Layout>
        <p className="text-sm text-slate-500">Chargement...</p>
      </Layout>
    )
  }

  const onglets = [
    { id: 'compte', label: 'Compte', icon: User },
    ...(commercial ? [{ id: 'commercial', label: 'Commercial', icon: Briefcase }] : []),
    ...(moi.is_staff
      ? [
          { id: 'general', label: 'Général', icon: Building2 },
          { id: 'utilisateurs', label: 'Utilisateurs', icon: Users },
          { id: 'securite', label: 'Sécurité', icon: Shield },
          { id: 'donnees', label: 'Données', icon: Database },
        ]
      : []),
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

      <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200">
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
        {ongletActif === 'commercial' && commercial && <OngletCommercial commercial={commercial} />}
        {ongletActif === 'general' && entreprise && (
          <OngletGeneral entreprise={entreprise} setEntreprise={setEntreprise} />
        )}
        {ongletActif === 'utilisateurs' && moi.is_staff && <OngletUtilisateurs />}
        {ongletActif === 'securite' && entreprise && (
          <OngletSecurite entreprise={entreprise} setEntreprise={setEntreprise} />
        )}
        {ongletActif === 'donnees' && moi.is_staff && <OngletDonnees />}
      </div>
    </Layout>
  )
}
