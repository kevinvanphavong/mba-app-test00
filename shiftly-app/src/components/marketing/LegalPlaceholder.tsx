// Page légale placeholder (CGU / Confidentialité / Mentions légales).
// Le contenu définitif sera rédigé par Kévin avant le lancement commercial.
export default function LegalPlaceholder({ title, body }: { title: string; body: string }) {
  return (
    <main className="mkt-section">
      <div className="mkt-container" style={{ maxWidth: 760 }}>
        <div className="mkt-section-label">📄 Page légale</div>
        <h1 className="mkt-section-title" style={{ marginBottom: 24 }}>
          {title}
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-soft)', lineHeight: 1.7 }}>{body}</p>
        <p style={{ marginTop: 32, fontSize: 13, color: 'var(--muted)' }}>
          Page en cours de rédaction · dernière mise à jour : 2026-06-03
        </p>
      </div>
    </main>
  )
}
