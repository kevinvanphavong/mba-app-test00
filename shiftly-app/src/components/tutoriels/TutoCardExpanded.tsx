import StepItem      from './StepItem'
import TipBox        from './TipBox'
import TutoBlockMedia from './TutoBlockMedia'
import type { TutoBlock } from '@/types/tutoriel'

interface TutoCardExpandedProps {
  contenu: TutoBlock[]
}

/** Contenu déroulé — intro · steps numérotés · tip box, avec médias inline par bloc */
export default function TutoCardExpanded({ contenu }: TutoCardExpandedProps) {
  return (
    <div className="mt-3 pt-3 border-t border-border">
      {contenu.map((block, i) => {
        if (block.type === 'intro') {
          return (
            <div key={i} className="mb-4">
              <p className="text-[12px] text-muted leading-relaxed">{block.text}</p>
              {block.mediaIds && block.mediaIds.length > 0 && (
                <TutoBlockMedia mediaIds={block.mediaIds} />
              )}
            </div>
          )
        }
        if (block.type === 'step') {
          return (
            <StepItem
              key={i}
              number={block.number}
              title={block.title}
              text={block.text}
              mediaIds={block.mediaIds}
            />
          )
        }
        if (block.type === 'tip') {
          return <TipBox key={i} text={block.text} mediaIds={block.mediaIds} />
        }
        return null
      })}
    </div>
  )
}
