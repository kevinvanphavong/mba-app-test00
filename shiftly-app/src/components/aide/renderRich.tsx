import { Fragment, type ReactNode } from 'react'

/**
 * Rend le gras inline `**texte**` et le code inline `` `texte` `` sans recourir à
 * `dangerouslySetInnerHTML`. On tokenise la chaîne et on mappe chaque segment sur
 * l'élément React correspondant.
 */
const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`)/g

export function renderRich(text: string): ReactNode {
  return text.split(TOKEN).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-text">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="rounded-[5px] border border-border bg-surface2 px-1.5 py-0.5 text-[12px] text-text"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}
