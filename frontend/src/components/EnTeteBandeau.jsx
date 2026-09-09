export default function EnTeteBandeau({ titre, sousTitre, icone: Icone }) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 px-6 py-8 text-white shadow-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(206,154,46,0.35)_1.5px,transparent_1.5px)] bg-[length:22px_22px]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(206,154,46,0.08)_0px,rgba(206,154,46,0.08)_2px,transparent_2px,transparent_18px)]" />
      <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full border-2 border-or-400/25" />
      <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-or-400/10" />
      <div className="absolute top-1/2 left-1/3 h-20 w-20 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="absolute -bottom-20 left-1/4 h-28 w-28 rounded-full bg-white/5" />
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full border-2 border-or-400/30" />
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-or-400/15" />
      <div className="absolute -bottom-16 -right-24 h-56 w-56 rounded-full border-2 border-or-400/20" />
      <div className="absolute -bottom-16 -right-24 h-56 w-56 rounded-full bg-white/5" />
      <div className="relative flex items-center gap-4">
        {Icone && (
          <div className="flex h-20 w-12 shrink-0 items-center justify-center rounded-full bg-transparent">
            <Icone className="h-10 w-10" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold">{titre}</h1>
          {sousTitre && <p className="text-sm text-neutral-300">{sousTitre}</p>}
        </div>
      </div>
    </div>
  )
}
