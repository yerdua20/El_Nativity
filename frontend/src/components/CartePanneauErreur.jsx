import { MapPinOff } from 'lucide-react'

export default function CartePanneauErreur() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white p-8 text-center"
      style={{ height: '32rem' }}
    >
      <MapPinOff className="h-8 w-8 text-slate-400" />
      <p className="text-sm font-medium text-slate-700">La carte n'a pas pu s'afficher.</p>
      <p className="max-w-sm text-sm text-slate-500">
        Un problème est survenu lors du chargement de la carte interactive. Réessayez de
        rafraîchir la page.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 rounded-2xl bg-vert-700 px-4 py-2 text-sm font-medium text-white hover:bg-vert-800"
      >
        Rafraîchir la page
      </button>
    </div>
  )
}
