import Nav from './Nav'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Nav />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
