import { useEffect, useState } from 'react'
import { listerFileAttente, surChangementFile } from './sync'

/** Liste réactive de la file d'attente locale, rafraîchie à chaque changement. */
export function useFileAttente() {
  const [entrees, setEntrees] = useState([])

  useEffect(() => {
    function rafraichir() {
      listerFileAttente().then(setEntrees)
    }
    rafraichir()
    return surChangementFile(rafraichir)
  }, [])

  return entrees
}
