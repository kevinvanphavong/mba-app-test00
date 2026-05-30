'use client'

import SidebarItem from '@/components/layout/SidebarItem'
import type { NavSectionGroup } from '@/hooks/useNavItems'

interface Props {
  section:     NavSectionGroup
  collapsed:   boolean
  showDivider: boolean
  onItemClick?: () => void
}

/**
 * SidebarSection — un bloc de nav avec son header.
 * En mode collapsed, le header textuel est remplacé par un séparateur fin.
 */
export default function SidebarSection({ section, collapsed, showDivider, onItemClick }: Props) {
  return (
    <div className="flex flex-col">
      {collapsed ? (
        showDivider && (
          <div className="mx-3 my-2 border-t border-border" aria-hidden />
        )
      ) : (
        <div className="text-[9px] font-syne font-bold uppercase tracking-widest text-muted mb-1.5 px-3">
          {section.label}
        </div>
      )}

      <div className="flex flex-col gap-0.5">
        {section.items.map(item => (
          <SidebarItem
            key={item.href}
            item={item}
            collapsed={collapsed}
            onClick={onItemClick}
          />
        ))}
      </div>
    </div>
  )
}
