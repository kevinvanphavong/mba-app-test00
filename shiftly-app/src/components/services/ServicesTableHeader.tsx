import { ty } from '@/lib/typography'

/** Largeurs partagées entre header + lignes du tableau /services. */
export const TABLE_GRID_CLASS =
  'grid grid-cols-[24px_160px_130px_70px_1fr_200px_140px_110px] gap-2.5 px-4 items-center'

export default function ServicesTableHeader() {
  return (
    <div className={`${TABLE_GRID_CLASS} bg-surface2 border-b border-border py-2.5`}>
      <div />
      <div className={ty.sectionLabelMd}>Date</div>
      <div className={ty.sectionLabelMd}>Horaires</div>
      <div className={ty.sectionLabelMd}>Staff</div>
      <div className={ty.sectionLabelMd}>Équipe</div>
      <div className={ty.sectionLabelMd}>Zones</div>
      <div className={ty.sectionLabelMd}>Responsable</div>
      <div className={`${ty.sectionLabelMd} text-right`}>Statut</div>
    </div>
  )
}
