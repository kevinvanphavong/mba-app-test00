import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="text-center">
        <div className="font-syne font-extrabold text-[48px] text-accent">404</div>
        <p className="text-muted text-[13px] mb-6">Cette page n'existe pas.</p>
        <Link
          href="/service"
          className="bg-accent text-white font-bold text-[13px] px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}
