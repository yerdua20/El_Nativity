import apiClient from '../api/client'
import { db } from './db'

let synchronisationEnCours = false
const abonnes = new Set()

function notifier() {
  abonnes.forEach((callback) => callback())
}

/** S'abonner aux changements de la file d'attente (pour un badge, une liste...). */
export function surChangementFile(callback) {
  abonnes.add(callback)
  return () => abonnes.delete(callback)
}

/**
 * Ajoute une écriture à la file locale, puis tente immédiatement de
 * la synchroniser si une connexion est disponible. Ne lève jamais :
 * l'appelant peut considérer l'écriture comme faite dès cet appel,
 * qu'elle parte tout de suite ou qu'elle attende la reconnexion.
 */
export async function mettreEnFile({ endpoint, payload, estMultipart = false }) {
  await db.file_attente.add({
    uuid: payload.uuid,
    endpoint,
    payload,
    estMultipart,
    createdAt: Date.now(),
    statut: 'en_attente',
    erreur: null,
  })
  notifier()
  synchroniser()
}

function versFormData(payload) {
  const formData = new FormData()
  Object.entries(payload).forEach(([cle, valeur]) => {
    if (valeur !== undefined && valeur !== null) formData.append(cle, valeur)
  })
  return formData
}

/**
 * Rejoue les écritures en attente, dans leur ordre de création.
 * S'arrête à la première erreur réseau (probablement encore hors
 * ligne) mais continue après une erreur applicative (4xx) : elle ne
 * se résoudra pas toute seule, autant traiter les suivantes.
 */
export async function synchroniser() {
  if (synchronisationEnCours) return
  synchronisationEnCours = true

  try {
    const entrees = await db.file_attente.where('statut').equals('en_attente').sortBy('id')

    for (const entree of entrees) {
      try {
        const corps = entree.estMultipart ? versFormData(entree.payload) : entree.payload
        await apiClient.post(entree.endpoint, corps)
        await db.file_attente.delete(entree.id)
        notifier()
      } catch (error) {
        if (error.response) {
          // Le serveur a répondu (ex: 400) : ça ne se réglera pas en
          // réessayant tel quel. On garde une trace et on continue.
          await db.file_attente.update(entree.id, {
            statut: 'echec',
            erreur: JSON.stringify(error.response.data),
          })
          notifier()
        } else {
          // Pas de réponse du tout : probablement hors ligne, on
          // réessaiera au prochain appel de synchroniser().
          break
        }
      }
    }
  } finally {
    synchronisationEnCours = false
  }
}

export async function compterEnAttente() {
  return db.file_attente.where('statut').equals('en_attente').count()
}

export async function listerFileAttente() {
  return db.file_attente.orderBy('id').reverse().toArray()
}

export async function reessayer(id) {
  await db.file_attente.update(id, { statut: 'en_attente', erreur: null })
  notifier()
  synchroniser()
}

export async function supprimerDeLaFile(id) {
  await db.file_attente.delete(id)
  notifier()
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', synchroniser)
}
