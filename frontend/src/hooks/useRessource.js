import { useEffect, useState } from 'react'

function lireCache(cle) {
  try {
    const brut = localStorage.getItem(cle)
    return brut ? JSON.parse(brut) : []
  } catch {
    return []
  }
}

/**
 * Charge une liste (clients, commerciaux, produits...) au montage, et
 * la garde en cache local (localStorage) pour que les listes
 * déroulantes des formulaires restent utilisables hors ligne, même
 * si elles datent un peu. Renvoie toujours un tableau, jamais null.
 */
export function useRessource(fetcher, cleCache) {
  const [donnees, setDonnees] = useState(() => (cleCache ? lireCache(cleCache) : []))

  useEffect(() => {
    let annule = false
    fetcher()
      .then((resultat) => {
        if (annule) return
        setDonnees(resultat)
        if (cleCache) {
          try {
            localStorage.setItem(cleCache, JSON.stringify(resultat))
          } catch {
            // Cache best-effort : un quota dépassé ne doit pas casser l'écran.
          }
        }
      })
      .catch(() => {
        // Hors ligne : on garde la valeur déjà en cache (ou vide).
      })
    return () => {
      annule = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return donnees
}
