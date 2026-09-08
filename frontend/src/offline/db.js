import Dexie from 'dexie'

/**
 * Base locale (IndexedDB) qui stocke les écritures créées hors ligne
 * en attente de synchronisation. Chaque entrée porte l'uuid métier
 * généré au moment de la saisie (anti-doublon côté serveur), donc la
 * rejouer plusieurs fois après une coupure réseau est sans danger.
 */
export const db = new Dexie('gestion-affaires-offline')

db.version(1).stores({
  file_attente: '++id, uuid, statut, createdAt',
})
