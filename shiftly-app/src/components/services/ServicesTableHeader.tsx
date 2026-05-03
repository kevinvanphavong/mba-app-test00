import { ty } from '@/lib/typography'

/** Largeurs partagées entre header + lignes du tableau /services.
 *  `minmax(0,1fr)` sur la colonne Équipe : empêche le min-content auto de Grid
 *  de pousser les autres colonnes quand le staff dépasse 4 (5 bulles affichées). */
export const TABLE_GRID_CLASS =
  'grid grid-cols-[24px_160px_130px_70px_minmax(0,1fr)_200px_110px] gap-2.5 px-4 items-center'

export default function ServicesTableHeader() {
  return (
    <div className={`${TABLE_GRID_CLASS} bg-surface2 border-b border-border py-2.5`}>
      <div />
      <div className={ty.sectionLabelMd}>Date</div>
      <div className={ty.sectionLabelMd}>Horaires</div>
      <div className={ty.sectionLabelMd}>Staff</div>
      <div className={ty.sectionLabelMd}>Équipe</div>
      <div className={ty.sectionLabelMd}>Zones</div>
      <div className={`${ty.sectionLabelMd} text-right`}>Statut</div>
    </div>
  )
}
