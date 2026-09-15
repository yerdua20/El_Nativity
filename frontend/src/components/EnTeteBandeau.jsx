export default function EnTeteBandeau({ titre, sousTitre, icone: Icone }) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-br from-vert-600 to-vert-800 px-6 py-8 text-white shadow-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(224,179,85,0.45)_1.5px,transparent_1.5px)] bg-[length:22px_22px]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(224,179,85,0.1)_0px,rgba(224,179,85,0.1)_2px,transparent_2px,transparent_18px)]" />
      <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full border-2 border-or-300/35" />
      <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-or-400/15" />
      <div className="absolute top-1/2 left-1/3 h-20 w-20 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="absolute -bottom-20 left-1/4 h-28 w-28 rounded-full bg-white/5" />
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full border-2 border-or-300/40" />
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-or-400/20" />
      <div className="absolute -bottom-16 -right-24 h-56 w-56 rounded-full border-2 border-or-300/25" />
      <div className="absolute -bottom-16 -right-24 h-56 w-56 rounded-full bg-white/5" />
      <div className="relative flex items-center gap-4">
        {Icone && (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-or-400/20 ring-2 ring-or-300/40">
            <Icone className="h-8 w-8 text-or-200" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold">{titre}</h1>
          {sousTitre && <p className="text-sm text-vert-100">{sousTitre}</p>}
        </div>
      </div>
    </div>
  )
}
