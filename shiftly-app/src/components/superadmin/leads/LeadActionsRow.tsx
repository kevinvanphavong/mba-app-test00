'use client'

interface Props {
  email: string
  phone: string
}

export default function LeadActionsRow({ email, phone }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      <a
        href={`mailto:${email}`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/30 text-[12px] font-semibold hover:bg-accent/15 transition"
      >
        ✉️ Envoyer un email
      </a>
      {phone && (
        <a
          href={`tel:${phone.replace(/\s+/g, '')}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green/10 text-green border border-green/30 text-[12px] font-semibold hover:bg-green/15 transition"
        >
          📞 Appeler {phone}
        </a>
      )}
    </div>
  )
}
