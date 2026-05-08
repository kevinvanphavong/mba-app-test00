import TutoBlockMedia from './TutoBlockMedia'

interface StepItemProps {
  number:    number
  title:     string
  text:      string
  mediaIds?: number[]
}

/** Étape numérotée dans le contenu d'un tutoriel */
export default function StepItem({ number, title, text, mediaIds }: StepItemProps) {
  return (
    <div className="flex gap-3">
      {/* Number bubble + vertical line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-6 h-6 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-extrabold text-accent font-syne">{number}</span>
        </div>
        {/* Vertical connector — always shown, last one fades */}
        <div className="w-px flex-1 bg-gradient-to-b from-accent/20 to-transparent mt-1 min-h-[12px]" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-3">
        <p className="text-[13px] font-semibold text-text mb-1 leading-snug">{title}</p>
        <p className="text-[12px] text-muted leading-relaxed">{text}</p>
        {mediaIds && mediaIds.length > 0 && <TutoBlockMedia mediaIds={mediaIds} />}
      </div>
    </div>
  )
}
