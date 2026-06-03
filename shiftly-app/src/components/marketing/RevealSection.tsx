'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

// Section qui révèle son contenu au scroll (fadeUp simple, viewport-once).
// Centralise le pattern pour les composants landing au lieu de réécrire le variant.
export default function RevealSection({
  children,
  className,
  id,
  style,
  as: Tag = 'section',
}: {
  children: ReactNode
  className?: string
  id?: string
  style?: React.CSSProperties
  as?: 'section' | 'div'
}) {
  const reduce = useReducedMotion()
  const variants = reduce
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
      }

  const MotionTag = Tag === 'section' ? motion.section : motion.div
  return (
    <MotionTag
      id={id}
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={variants}
    >
      {children}
    </MotionTag>
  )
}
