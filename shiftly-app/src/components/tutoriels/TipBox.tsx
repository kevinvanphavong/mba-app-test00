import TutoBlockMedia from './TutoBlockMedia'

interface TipBoxProps {
  text:      string
  mediaIds?: number[]
}

/** Encart conseil 💡 — fond ambre discret */
export default function TipBox({ text, mediaIds }: TipBoxProps) {
  return (
    <div className="flex flex-col gap-2 bg-yellow/6 border border-yellow/20 rounded-[10px] p-3 my-1">
      <div className="flex gap-2.5">
        <span className="text-base flex-shrink-0 mt-0.5">💡</span>
        <p className="text-[12px] text-yellow/90 leading-relaxed">{text}</p>
      </div>
      {mediaIds && mediaIds.length > 0 && <TutoBlockMedia mediaIds={mediaIds} />}
    </div>
  )
}
