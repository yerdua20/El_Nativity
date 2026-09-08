import { useEffect, useState } from 'react'

/**
 * Charge une liste (clients, commerciaux, produits...) au montage.
 * Renvoie toujours un tableau, jamais null, pour éviter les gardes
 * répétées dans chaque page qui affiche un <select>.
 */
export function useRessource(fetcher) {
  const [donnees, setDonnees] = useState([])

  useEffect(() => {
    let annule = false
    fetcher().then((resultat) => {
      if (!annule) setDonnees(resultat)
    })
    return () => {
      annule = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return donnees
}
