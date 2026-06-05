# Module Registre du personnel (MVP)

> Conformité **Art. L1221-13 et D1221-23 du Code du travail**. MVP solo
> founder : pas d'entité dédiée, tout vit dans `User` (12 colonnes
> nullables ajoutées en 2026-06).

## Périmètre V1

- Fiche RH enrichie sur `User` (état civil, adresse, emploi contractuel, sortie)
- Page `/reglages/registre` (MANAGER only) : table chronologique + tabs + recherche + export PDF
- Modale `ModalRegistreFiche` enrichie de `ModalEditStaff` (+ carte État civil & adresse + champ Emploi)
- Modale `ModalSortie` qui remplace `ConfirmModal` à la désactivation depuis `/staff`
- Endpoint `GET /api/registre-personnel/export.pdf` (dompdf + Twig)

## Hors scope V1

- Pas de scan / upload de pièces (CNI, titre de séjour, contrat signé) → V2
- Pas d'audit trail RH (qui a modifié quoi, quand) → V2
- Pas de NIR, IBAN, visite médicale, notification expiration titre séjour → V2 / V3
- Pas d'entité `EmployeeRecord` séparée — compromis solo founder

## Modèle de données

12 colonnes ajoutées à `user` (cf. `schema.sql`) :

| Champ | Type | Notes |
|---|---|---|
| `dateNaissance` | DATE | nullable |
| `lieuNaissanceCommune` | VARCHAR(120) | nullable |
| `lieuNaissanceDepartement` | VARCHAR(60) | nullable |
| `sexe` | VARCHAR(1) | enum app `'M'\|'F'`, Assert\Choice |
| `nationalite` | VARCHAR(60) | nullable |
| `emploi` | VARCHAR(120) | intitulé contractuel (≠ `role` applicatif) |
| `adresse` | VARCHAR(255) | nullable |
| `codePostal` | VARCHAR(10) | Assert\Regex `/^[0-9A-Z\- ]{2,10}$/` (DOM-TOM ok) |
| `ville` | VARCHAR(120) | nullable |
| `telephone` | VARCHAR(20) | libre, max 20 chars |
| `dateSortie` | DATE | groupe Serializer `user:rh-write` (MANAGER only) |
| `motifSortie` | VARCHAR(40) | enum app 7 valeurs (cf. `User::MOTIFS_SORTIE`) |

Tous nullables — n'invalide pas les fixtures existantes.

## Contrôle d'accès

- **Lecture** : MANAGER + soi-même (les champs RH d'un autre EMPLOYE sont
  nuls dans la réponse `/api/staff`). `dateSortie` et `motifSortie`
  exception : visibles par tous (info publique d'un ancien collègue).
- **Écriture** : MANAGER uniquement. La route `PUT /api/editeur/staff/{id}`
  est déjà gardée par `#[IsGranted('ROLE_MANAGER')]` — pas de Voter
  supplémentaire.
- **API Platform PUT** (self-edit) : le groupe `user:write` ne contient
  pas les champs RH `dateSortie`/`motifSortie` (groupe `user:rh-write`
  séparé, jamais exposé en denormalization). Un employé qui PUT sur sa
  propre fiche ne peut pas écrire ces champs (sérialiseur les ignore).

## Endpoint export PDF

```
GET /api/registre-personnel/export.pdf   ROLE_MANAGER
```

- Filtre `centre_id = JWT.centre_id` (multi-tenant)
- Inclut présents (`actif = true OR dateSortie IS NULL`) + sortis dans
  les 5 ans (`dateSortie >= now() - 5 years`)
- Tri `ORDER BY dateEmbauche ASC, nom ASC`
- Template Twig `registre/export.html.twig` — A4 portrait, header centre,
  tableau avec toutes les mentions de l'Art. D1221-23, signature manager,
  pied de page horodaté + rappel conservation 5 ans
- `Content-Disposition: attachment; filename="registre-personnel-{slug}-{Ymd}.pdf"`
- DejaVu Sans par défaut pour le support des accents UTF-8

## Composants front

| Fichier | Lignes | Rôle |
|---|---|---|
| `src/app/(app)/reglages/registre/page.tsx` | 148 | Page MANAGER (garde-fou + redirect `/reglages` si EMPLOYE) |
| `src/components/registre/RegistreHero.tsx` | 50 | Titre + KPI + bouton Exporter PDF |
| `src/components/registre/RegistreTable.tsx` | 97 | Table chronologique + pill contrat + opacity 0.6 sur sortis |
| `src/components/registre/ModalRegistreFiche.tsx` | 150 | Variante enrichie de `ModalEditStaff` |
| `src/components/registre/ModalSortie.tsx` | 129 | Date + motif + note interne (remplace `ConfirmModal` sur désactivation) |
| `src/components/registre/StaffFormEtatCivil.tsx` | 136 | Carte présentationnelle « État civil & adresse » |
| `src/components/registre/ficheState.ts` | 55 | State `FicheState` extrait (rule 3 ≤ 150 lignes) |
| `src/components/registre/registreMeta.ts` | 40 | Labels motifs, classes pills contrat, helpers `fmtFRDate`/`initials` |

## Helper download

`src/lib/api.ts` expose désormais `downloadBinary(path, filename)` —
récupère le blob via axios (intercepteur JWT) et force le download via un
`<a download>` temporaire. Évite de passer le token en query string sur
les routes binaires.

## Wiring `/staff` (désactivation)

À la désactivation d'un membre, `ModalSortie` remplace le `ConfirmModal`
historique. Elle demande date + motif (mention obligatoire au registre)
et appelle `useUpdateStaff` avec `actif: false, dateSortie, motifSortie`.

À la **réactivation**, le `ConfirmModal` simple est conservé ; le hook
reset `dateSortie: null, motifSortie: null` côté front pour ressortir le
membre du registre des sortis.

## Vérifications légales effectuées

- ORDER BY `dateEmbauche ASC` dans la query export ✓
- Filtre `centre_id` côté backend (jamais côté front uniquement) ✓
- Self-PUT employé ne peut pas écrire `dateSortie` / `motifSortie` (groupe
  Serializer + route ROLE_MANAGER) ✓
- dompdf UTF-8 + DejaVu Sans pour accents ✓
