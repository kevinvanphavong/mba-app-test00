/**
 * Contenu du centre d'aide (`/aide`) — donnée statique typée.
 *
 * Source de vérité : `aide.html` (maquette validée). Le texte est repris à
 * l'identique, les 16 rubriques dans le même ordre. Ce fichier est de la DONNÉE,
 * pas un composant : la limite de 150 lignes du CLAUDE.md ne s'y applique pas.
 *
 * Gras inline : `**texte**` · code inline : `` `texte` `` — rendus par renderRich.
 */
import type { AideRubrique } from '@/types/aide'

export const AIDE_RUBRIQUES: AideRubrique[] = [
  // ═══ BIENVENUE ═══
  {
    id: 'bienvenue',
    titre: 'Bienvenue',
    managerOnly: false,
    blocs: [
      { type: 'soustitre', texte: 'Shiftly, en deux mots.' },
      { type: 'p', texte: "Shiftly pilote **ce qui se passe pendant le service**. Vous découpez votre centre en **zones**, chaque zone porte des **missions** à faire et des **compétences** à acquérir. Chaque jour, l'équipe est affectée sur les zones, coche ses missions au fur et à mesure, pointe ses heures et signale les incidents. Le gérant voit tout en direct, valide les heures en fin de semaine et tient son registre du personnel." },
      { type: 'p', texte: "Ce n'est pas un logiciel de paie. C'est l'outil qui garantit que **le travail terrain est bien fait, même quand le manager n'est pas là**." },
      { type: 'soustitre', texte: 'Qui fait quoi.' },
      { type: 'p', texte: "Deux profils. L'**équipier** consulte le service du jour, coche ses missions, signale un incident, pointe ses heures, consulte son planning et lit les tutoriels. Le **gérant** a tout ça, plus le paramétrage (zones, missions, compétences), le planning, la validation des heures, le registre du personnel et les réglages du centre." },
      { type: 'soustitre', texte: 'Une journée type.' },
      { type: 'parcours', etapes: [
        { n: '01 · Ouverture', titre: 'On pointe', detail: "Chacun saisit son code à 4 chiffres sur la borne Pointage." },
        { n: '02 · Ouverture', titre: "Missions d'ouverture", detail: 'La liste du jour se coche zone par zone.' },
        { n: '03 · Pendant', titre: 'Le service tourne', detail: 'Missions « Pendant », incidents, relevés HACCP.' },
        { n: '04 · Fermeture', titre: 'On ferme et on part', detail: 'Missions ménage et fermeture, puis pointage de départ.' },
        { n: '05 · Lundi', titre: 'Le gérant valide', detail: 'Validation hebdo des heures de la semaine écoulée.' },
      ] },
      { type: 'soustitre', texte: 'Naviguer.' },
      { type: 'p', texte: "Le menu de gauche est rangé par usage : **Pilotage** (dashboard), **Opérations** (ce qui se passe aujourd'hui), **Planification** (ce qui est prévu), **Équipe** (votre référentiel). Un équipier ne voit que ce qui le concerne — les entrées gérant sont masquées, pas grisées." },
      { type: 'callout', ton: 'tip', texte: "Le bouton **« Je suis gérant / Je suis équipier »** en haut de cette page filtre toute l'aide. Si vous formez un nouvel équipier, basculez sur son profil : il ne verra que ses rubriques." },
    ],
  },

  // ═══ PREMIERS PAS ═══
  {
    id: 'premiers-pas',
    titre: 'Premiers pas',
    managerOnly: true,
    blocs: [
      { type: 'soustitre', texte: 'À quoi ça sert.' },
      { type: 'p', texte: "Un centre vide ne sert à rien : Shiftly ne peut pas deviner vos zones ni vos missions. Cette rubrique donne **l'ordre de configuration**. Chaque étape dépend de la précédente — la suivre évite de tout reprendre." },
      { type: 'soustitre', texte: 'Pas à pas — configurer votre centre.' },
      { type: 'etapes', items: [
        "**Réglages** — nom du centre, adresse, téléphone, horaires d'ouverture jour par jour. Les horaires servent à générer les services : un jour marqué fermé ne produira jamais de service.",
        "**Postes → Zones** — créez vos zones réelles (Accueil, Bar, Salle, Bowling, Laser…). Une zone = un endroit où quelqu'un est affecté. Donnez-leur une couleur, elle se retrouve partout dans l'app.",
        "**Postes → Missions** — pour chaque zone, listez les tâches, classées par moment : **Ouverture**, **Pendant**, **Ménage**, **Fermeture**. Commencez par l'ouverture et la fermeture, c'est là que l'oubli coûte le plus cher.",
        "**Postes → Compétences** — ce qu'un équipier doit savoir faire dans la zone, avec une difficulté (simple, avancée, expérimenté) et des points.",
        "**Staff** — créez vos salariés : nom, e-mail, rôle Manager ou Employé, heures hebdo, type de contrat, et surtout leur **code de pointage à 4 chiffres**.",
        "**Planning** — posez la semaine : qui travaille, quand, sur quelle zone. Publiez-la pour que l'équipe la voie.",
        "**Service du jour** — le jour J, tout est là. Vous n'avez plus qu'à ouvrir.",
      ] },
      { type: 'figure', src: '/aide/reglages-horaires.jpg', url: '/reglages/horaires', alt: "Réglages — horaires d'ouverture",
        legende: "Les horaires, jour par jour. **1** le lundi désactivé : ce jour ne générera jamais de service et restera vide dans le planning · **2** les créneaux, qui définissent l'amplitude de chaque service.",
        pins: [{ n: 1, x: 95, y: 11 }, { n: 2, x: 39, y: 23 }] },
      { type: 'callout', ton: 'tip', texte: "Ne cherchez pas l'exhaustivité au départ. **Trois zones et vingt missions** suffisent pour démarrer : vous compléterez au fil des semaines, quand l'équipe vous dira ce qui manque." },
      { type: 'callout', ton: 'warn', texte: "Renseignez les horaires d'ouverture **avant** de toucher au planning. Sans eux, les jours d'ouverture sont indéterminés et le planning se génère de travers." },
    ],
  },

  // ═══ SERVICE DU JOUR ═══
  {
    id: 'service',
    titre: 'Service du jour',
    managerOnly: false,
    blocs: [
      { type: 'soustitre', texte: 'À quoi ça sert.' },
      { type: 'p', texte: "C'est **l'écran le plus utilisé de Shiftly**, celui qui reste ouvert pendant tout le service. Il montre qui est là, sur quelle zone, et ce qu'il reste à faire." },
      { type: 'soustitre', texte: 'Ce que vous pouvez faire.' },
      { type: 'p', texte: "Voir les zones du jour et qui y est affecté, cocher les missions au fur et à mesure, joindre une photo quand c'est demandé, signaler un incident, lire la note du manager, et suivre le **taux de complétion** qui monte au fil de la journée." },
      { type: 'soustitre', texte: 'Pas à pas — cocher une mission.' },
      { type: 'etapes', items: [
        "Ouvrez **Service du jour** et sélectionnez votre zone.",
        "Repérez le bloc du moment : **Ouverture** en début de service, **Pendant** une fois ouvert, **Ménage** et **Fermeture** en fin de journée.",
        "Cochez la mission une fois faite. Votre nom et l'heure sont enregistrés automatiquement.",
        "Si la mission demande une preuve (relevé de température, photo), l'app vous la réclame avant de valider.",
      ] },
      { type: 'figure', src: '/aide/service-du-jour.jpg', url: '/service', alt: 'Service du jour',
        legende: "L'écran du service. **1** la zone et son avancement · **2** la catégorie de la mission, qui la fait apparaître au bon moment · **3** la case à cocher, qui enregistre votre nom et l'heure · **4** l'avancement global de la journée.",
        pins: [{ n: 1, x: 30, y: 56.5 }, { n: 2, x: 27, y: 71.5 }, { n: 3, x: 22, y: 74 }, { n: 4, x: 94, y: 24.5 }] },
      { type: 'soustitre', texte: 'Les priorités.' },
      { type: 'tableau', entetes: ['Priorité', 'Ce que ça veut dire'], lignes: [
        ['**Vitale**', 'Non négociable. Sécurité, conformité, ouverture impossible sans.'],
        ['**Important**', "Attendu à chaque service, mais pas bloquant si le rush l'a repoussé."],
        ['**Ne pas oublier**', 'À faire si le temps le permet.'],
      ] },
      { type: 'soustitre', texte: 'Pas à pas — signaler un incident.' },
      { type: 'etapes', items: [
        "Bouton **Signaler un incident** depuis le service du jour.",
        "Décrivez de façon courte et factuelle — « Piste 6 : capteur HS », pas « ça marche pas ».",
        "Choisissez la **sévérité** : basse, moyenne, haute.",
        "Précisez la zone et, si besoin, les personnes concernées. L'incident part en statut **Ouvert**.",
      ] },
      { type: 'figure', src: '/aide/service-incident.jpg', url: '/service · signalement', alt: 'Signaler un incident',
        legende: "Le formulaire. **1** la description, à écrire de façon factuelle · **2** la sévérité — une sévérité haute remonte immédiatement sur le dashboard du gérant · **3** la zone concernée, et en dessous les personnes impliquées, facultatives.",
        pins: [{ n: 1, x: 50, y: 24 }, { n: 2, x: 50, y: 34 }, { n: 3, x: 25, y: 41 }] },
      { type: 'p', texte: "Le gérant le suit ensuite depuis **Réglages → Incidents**, où il passe en **En cours** puis **Résolu**." },
      { type: 'soustitre', texte: 'Astuces & pièges.' },
      { type: 'callout', ton: 'warn', texte: "**Le jour change à 5h du matin, pas à minuit.** Si vous fermez à 1h, l'app affiche encore le service de la veille — c'est voulu, votre service de nuit n'est pas coupé en deux. À 5h01, on bascule sur le nouveau jour." },
      { type: 'callout', ton: 'tip', texte: "Les missions **ponctuelles** n'existent que pour un service donné : parfaites pour « livraison à réceptionner ce soir » sans polluer la liste des autres jours." },
      { type: 'callout', ton: 'tip', texte: "La **note du manager** en haut du service est le meilleur endroit pour un message qui doit être lu par tout le monde — un CE de 40 personnes à 19h, une machine en panne." },
    ],
  },

  // ═══ POINTAGE ═══
  {
    id: 'pointage',
    titre: 'Pointage',
    managerOnly: false,
    blocs: [
      { type: 'soustitre', texte: 'À quoi ça sert.' },
      { type: 'p', texte: "Enregistrer les heures réellement travaillées. La page est pensée comme une **borne** : on l'ouvre sur une tablette ou un PC à la réception, et toute l'équipe vient y pointer. Ce n'est pas une app individuelle sur le téléphone de chacun." },
      { type: 'soustitre', texte: 'Pas à pas — pointer son arrivée.' },
      { type: 'etapes', items: [
        "Sur la borne, trouvez votre carte dans la liste du jour.",
        "Saisissez votre **code à 4 chiffres**. C'est ce code qui empêche un collègue de pointer à votre place.",
        "Validez : votre statut passe à **En cours** et l'heure est figée.",
        "Pour une pause, bouton **Pause** puis **Reprendre**. Chaque pause est comptée séparément.",
        "En fin de service, **Pointer le départ**. Statut **Terminé**.",
      ] },
      { type: 'figure', src: '/aide/pointage.jpg', url: '/pointage', alt: 'Pointage — vue borne',
        legende: "La page telle qu'elle reste ouverte sur la tablette d'accueil. **1** la carte du salarié, avec sa zone et son créneau prévu · **2** le bouton d'arrivée, qui demande le code à 4 chiffres. Le compteur en haut à droite suit le service en direct.",
        pins: [{ n: 1, x: 58, y: 30 }, { n: 2, x: 88, y: 34 }] },
      { type: 'soustitre', texte: 'Les statuts.' },
      { type: 'tableau', entetes: ['Statut', 'Signification'], lignes: [
        ['**Prévu**', "Créé depuis le planning, la personne n'est pas encore arrivée."],
        ['**En cours**', 'Arrivée pointée, la personne travaille.'],
        ['**En pause**', 'Pause démarrée, pas encore reprise.'],
        ['**Terminé**', 'Départ pointé, la journée est close.'],
        ['**Absent**', "Marqué par le gérant : la personne n'est pas venue."],
      ] },
      { type: 'soustitre', texte: 'Astuces & pièges.' },
      { type: 'callout', ton: 'warn', texte: "**Le code de pointage n'est pas le mot de passe de connexion.** Ce sont deux choses distinctes : 4 chiffres pour la borne, un mot de passe pour se connecter à l'app. Confondre les deux est l'erreur la plus fréquente les premiers jours." },
      { type: 'callout', ton: 'tip', texte: "Un renfort de dernière minute qui n'était pas au planning peut quand même pointer : le pointage n'exige pas un poste planifié." },
      { type: 'callout', ton: 'warn', texte: "Quelqu'un a oublié de pointer son départ ? **Ne bricolez pas** un nouveau pointage. La correction se fait proprement en **Validation hebdo**, où elle reste tracée." },
    ],
  },

  // ═══ VALIDATION HEBDO ═══
  {
    id: 'validation',
    titre: 'Validation hebdo',
    managerOnly: true,
    blocs: [
      { type: 'soustitre', texte: 'À quoi ça sert.' },
      { type: 'p', texte: "Une fois par semaine, vous relisez les heures réellement pointées, corrigez les oublis, et validez. C'est ce qui transforme des pointages bruts en **heures opposables**, prêtes à partir en paie." },
      { type: 'soustitre', texte: 'Ce que vous pouvez faire.' },
      { type: 'p', texte: "Pour chaque salarié : voir les **heures travaillées** face aux **heures prévues**, l'**écart**, les **heures supplémentaires**, le nombre de **retards** et d'**absences**. Corriger une arrivée, un départ ou une pause. Laisser un commentaire. Puis valider." },
      { type: 'soustitre', texte: 'Pas à pas — valider une semaine.' },
      { type: 'etapes', items: [
        "Ouvrez **Pointage → Validation hebdo** et sélectionnez la semaine.",
        "Parcourez les lignes en anomalie — écart important, départ manquant, retard répété.",
        "Ouvrez le détail du salarié concerné et corrigez l'horaire. **Motivez la correction** : elle est conservée et traçable.",
        "Ajoutez un commentaire si la semaine mérite une explication.",
        "Validez. La ligne passe en **Validée** — ou **Corrigée** si vous êtes intervenu.",
      ] },
      { type: 'figure', src: '/aide/validation-hebdo.jpg', url: '/pointage/validation', alt: 'Validation hebdomadaire',
        legende: "La semaine écoulée. **1** les heures réellement travaillées · **2** l'écart avec le prévu, heures supplémentaires comprises · **3** la validation en masse, une fois les anomalies traitées. Le tableau du bas détaille chaque salarié, jour par jour.",
        pins: [{ n: 1, x: 28, y: 24 }, { n: 2, x: 81, y: 24 }, { n: 3, x: 92, y: 14 }] },
      { type: 'soustitre', texte: 'Astuces & pièges.' },
      { type: 'callout', ton: 'tip', texte: "Faites-le le **lundi matin, toujours**. Une semaine fraîche se corrige de mémoire ; à trois semaines, plus personne ne sait pourquoi Untel est parti à 23h40." },
      { type: 'callout', ton: 'warn', texte: "Une correction ne remplace pas le pointage d'origine : elle s'ajoute par-dessus, et les deux restent visibles. C'est votre protection en cas de litige — ne cherchez pas à effacer." },
    ],
  },

  // ═══ PLANNING ═══
  {
    id: 'planning',
    titre: 'Planning',
    managerOnly: false,
    blocs: [
      { type: 'soustitre', texte: 'À quoi ça sert.' },
      { type: 'p', texte: "Poser qui travaille, quand, et sur quelle zone. Le gérant construit la semaine ; l'équipier consulte la sienne." },
      { type: 'soustitre', texte: 'Ce que vous pouvez faire — gérant.' },
      { type: 'p', texte: "Affecter un salarié sur une zone et un créneau, poser plusieurs shifts dans la même journée, déclarer des **absences**, dupliquer une semaine, laisser une note, puis **publier**. Des alertes remontent automatiquement les problèmes : repos non respecté, amplitude trop longue, dépassement d'heures, délai de prévenance de la convention IDCC 1790." },
      { type: 'soustitre', texte: 'Ce que vous pouvez faire — équipier.' },
      { type: 'p', texte: "Voir vos trois prochaines semaines dès qu'elles sont publiées : vos jours, vos horaires, vos zones." },
      { type: 'soustitre', texte: 'Brouillon ou publié.' },
      { type: 'tableau', entetes: ['Statut', 'Qui le voit'], lignes: [
        ['**Brouillon**', 'Vous seul. Vous construisez, vous déplacez, rien ne fuite.'],
        ['**Publié**', "Toute l'équipe. C'est le planning qui fait foi."],
      ] },
      { type: 'figure', src: '/aide/planning.jpg', url: '/planning', alt: 'Planning hebdomadaire',
        legende: "La semaine en construction. **1** le statut — ici des modifications ne sont pas encore publiées, l'équipe voit donc une version périmée · **2** une affectation, avec sa zone et sa pause · **3** la duplication de semaine, le raccourci le plus rentable.",
        pins: [{ n: 1, x: 63, y: 19 }, { n: 2, x: 48, y: 42 }, { n: 3, x: 81, y: 29 }] },
      { type: 'soustitre', texte: "Les types d'absence." },
      { type: 'p', texte: "`CP` congés payés · `RTT` · `MALADIE` · `REPOS` · `EVENEMENT_FAMILLE` · `AUTRE`. Une absence bloque l'affectation sur la journée et remonte en validation hebdo." },
      { type: 'soustitre', texte: 'Astuces & pièges.' },
      { type: 'callout', ton: 'warn', texte: "**Tant que la semaine est en brouillon, personne ne la voit.** Le grand classique : construire un planning parfait le jeudi, oublier de publier, et recevoir cinq messages le lundi." },
      { type: 'callout', ton: 'tip', texte: "Un jour marqué fermé dans vos horaires apparaît vide, et c'est normal — ce n'est pas un bug de planning." },
      { type: 'callout', ton: 'tip', texte: "**Dupliquez la semaine précédente** puis ajustez : sur un centre de loisirs, 80 % d'une semaine ressemble à la précédente." },
      { type: 'callout', ton: 'info', icone: '⚖️', texte: "Les alertes légales sont une **aide, pas un blocage**. Shiftly vous prévient d'un repos trop court, il ne vous empêche pas d'enregistrer — c'est vous qui décidez, et qui restez responsable." },
    ],
  },

  // ═══ SERVICES ═══
  {
    id: 'services',
    titre: 'Services',
    managerOnly: true,
    blocs: [
      { type: 'soustitre', texte: 'À quoi ça sert.' },
      { type: 'p', texte: "La vue calendaire de vos journées d'exploitation. Là où **Service du jour** montre aujourd'hui, **Services** montre la série : ce qui est passé, ce qui vient." },
      { type: 'soustitre', texte: 'Ce que vous pouvez faire.' },
      { type: 'p', texte: "Naviguer d'une semaine à l'autre, ouvrir un service passé pour voir ce qui a été fait et par qui, ajuster les horaires d'un service particulier, désigner le manager responsable, et lire le **taux de complétion** de chaque journée." },
      { type: 'soustitre', texte: 'Les statuts.' },
      { type: 'tableau', entetes: ['Statut', 'Signification'], lignes: [
        ['**Planifié**', 'Prévu, pas encore commencé.'],
        ['**En cours**', "C'est le jour actif — celui de la journée d'exploitation en cours."],
        ['**Terminé**', 'Journée close, les données sont figées.'],
      ] },
      { type: 'figure', src: '/aide/services.jpg', url: '/services', alt: 'Services',
        legende: "La série des journées d'exploitation, filtrable En cours / À venir / Historique. Ouvrir une ligne montre ce qui a été fait ce jour-là, et par qui.",
        pins: [] },
      { type: 'callout', ton: 'tip', texte: "Un taux de complétion qui plafonne toujours au même endroit ne veut pas dire que l'équipe est mauvaise : le plus souvent, une mission est mal placée ou irréaliste. Allez la revoir dans **Postes**." },
    ],
  },

  // ═══ DASHBOARD ═══
  {
    id: 'dashboard',
    titre: 'Dashboard',
    managerOnly: true,
    blocs: [
      { type: 'soustitre', texte: 'À quoi ça sert.' },
      { type: 'p', texte: "Votre vue d'ensemble en dix secondes, le matin en arrivant : où en est le service, qui est présent, ce qui cloche." },
      { type: 'soustitre', texte: 'Ce que vous pouvez faire.' },
      { type: 'p', texte: "Lire les indicateurs du jour — taux de complétion, staff présent, zones couvertes — repérer les **incidents ouverts**, et voir d'un coup d'œil ce qui demande votre arbitrage." },
      { type: 'figure', src: '/aide/dashboard.jpg', url: '/dashboard', alt: 'Dashboard',
        legende: "La vue du matin. **1** l'avancement par zone, qui montre où le service décroche · **2** les incidents ouverts — la seule zone qui réclame une décision de votre part.",
        pins: [{ n: 1, x: 58, y: 35 }, { n: 2, x: 68, y: 61 }] },
      { type: 'callout', ton: 'tip', texte: "Prenez l'habitude de l'ouvrir **en arrivant, pas en partant**. Un incident ouvert repéré à 10h se règle ; repéré à 23h, il devient le problème de l'équipe du lendemain." },
    ],
  },

  // ═══ STAFF ═══
  {
    id: 'staff',
    titre: 'Staff',
    managerOnly: false,
    blocs: [
      { type: 'soustitre', texte: 'À quoi ça sert.' },
      { type: 'p', texte: "Votre équipe : qui est là, qui sait faire quoi, et qui progresse." },
      { type: 'soustitre', texte: 'Ce que vous pouvez faire — gérant.' },
      { type: 'p', texte: "Créer et modifier une fiche salarié (identité, rôle, heures hebdo, contrat, code de pointage), **valider les compétences acquises**, désactiver un compte, et accéder aux informations contractuelles du registre." },
      { type: 'soustitre', texte: 'Ce que vous pouvez faire — équipier.' },
      { type: 'p', texte: "Consulter l'équipe, voir qui est présent aujourd'hui, et suivre vos propres compétences validées." },
      { type: 'soustitre', texte: 'Comment marche le niveau.' },
      { type: 'p', texte: "Le niveau d'un équipier se calcule sur la **part des compétences de votre centre qu'il a validées**, pas sur son ancienneté ni sur un score arbitraire." },
      { type: 'tableau', entetes: ['Compétences acquises', 'Niveau'], lignes: [
        ['Moins de 30 %', 'Débutant'],
        ['30 à 60 %', 'Intermédiaire'],
        ['60 à 90 %', 'Confirmé'],
        ['90 % et plus', 'Avancé'],
      ] },
      { type: 'soustitre', texte: 'Pas à pas — valider une compétence.' },
      { type: 'etapes', items: [
        "Ouvrez la fiche du salarié depuis **Staff**.",
        "Allez dans ses compétences, groupées par zone.",
        "Cochez celle qu'il maîtrise **après l'avoir vu faire**, pas sur déclaration.",
        "Son niveau et ses points se recalculent immédiatement.",
      ] },
      { type: 'soustitre', texte: 'Pas à pas — définir un code de pointage.' },
      { type: 'etapes', items: [
        "Depuis **Staff**, ouvrez **modifier** sur le membre concerné.",
        "Bloc **Accès**, champ code de pointage : saisissez 4 chiffres.",
        "Enregistrez. Le code est actif au pointage suivant. C'est le seul endroit où il se règle, et seul un gérant peut le faire.",
      ] },
      { type: 'figure', src: '/aide/staff.jpg', url: '/staff', alt: 'Staff — le roster',
        legende: "L'équipe en un tableau. **1** les zones maîtrisées · **2** le niveau, calculé sur la part des compétences validées · **3** les points cumulés. Déplier une ligne ouvre le détail des compétences, où le gérant les coche une par une.",
        pins: [{ n: 1, x: 55, y: 44 }, { n: 2, x: 66, y: 44 }, { n: 3, x: 79, y: 44 }] },
      { type: 'callout', ton: 'warn', texte: "Une compétence validée trop vite est une promesse que le planning va tenir pour vous : si l'app dit que quelqu'un sait tenir le bar seul un samedi, vous finirez par l'y mettre." },
      { type: 'callout', ton: 'tip', texte: "Ajouter une compétence à une zone fait mécaniquement **baisser le niveau de tout le monde** — le dénominateur a grandi. C'est normal, et c'est un bon indicateur de ce qu'il reste à former." },
    ],
  },

  // ═══ POSTES ═══
  {
    id: 'postes',
    titre: 'Postes',
    managerOnly: false,
    blocs: [
      { type: 'soustitre', texte: 'À quoi ça sert.' },
      { type: 'p', texte: "C'est le **référentiel de votre centre** : vos zones, les missions de chaque zone, et les compétences associées. Tout le reste de Shiftly consomme ce que vous définissez ici. Le gérant édite, l'équipier consulte." },
      { type: 'soustitre', texte: 'Les zones.' },
      { type: 'p', texte: "Une zone est un endroit où quelqu'un est affecté : **Accueil**, **Bar**, **Salle**, **Manager**, ou vos propres découpages (Bowling, Laser, Arcade, VR). La couleur choisie ici se retrouve dans le planning, le service et le pointage." },
      { type: 'soustitre', texte: 'Les missions.' },
      { type: 'p', texte: "Chaque mission appartient à une zone et porte trois attributs :" },
      { type: 'liste', items: [
        "**Catégorie** — Ouverture, Pendant, Ménage, Fermeture. C'est ce qui la fait apparaître au bon moment du service.",
        "**Fréquence** — **Fixe** (à chaque service) ou **Ponctuelle** (rattachée à un seul service).",
        "**Priorité** — vitale, important, ne pas oublier.",
      ] },
      { type: 'p', texte: "L'ordre d'affichage se règle au **glisser-déposer** : mettez-les dans l'ordre où on les fait vraiment." },
      { type: 'soustitre', texte: 'Les compétences.' },
      { type: 'p', texte: "Ce qu'un équipier doit savoir faire dans la zone, avec une **difficulté** (simple, avancée, expérimenté) et des **points**. C'est la base du niveau affiché dans Staff." },
      { type: 'soustitre', texte: 'Pas à pas — ajouter une mission.' },
      { type: 'etapes', items: [
        "Ouvrez **Postes** et sélectionnez la zone.",
        "**Ajouter une mission**, puis écrivez-la à l'impératif et de façon vérifiable — « Relever les températures des frigos », pas « s'occuper du froid ».",
        "Choisissez catégorie, fréquence et priorité.",
        "Glissez-la à sa place dans la liste. Elle apparaît au prochain service.",
      ] },
      { type: 'figure', src: '/aide/postes.jpg', url: '/postes', alt: 'Postes — zones, missions, compétences',
        legende: "Le référentiel du centre. **1** les zones · **2** les missions rangées par moment du service, avec leur priorité · **3** le mode Réordonner, qui règle l'ordre d'affichage dans le service du jour.",
        pins: [{ n: 1, x: 29, y: 22 }, { n: 2, x: 25, y: 38 }, { n: 3, x: 84, y: 33 }] },
      { type: 'callout', ton: 'tip', texte: "Une mission doit se répondre par **oui ou non**. Si on peut la faire « à moitié », c'est qu'il en faut deux." },
      { type: 'callout', ton: 'warn', texte: "**Archivez, ne supprimez pas.** Supprimer une mission efface aussi l'historique de qui l'a faite. L'archivage la retire des services à venir sans toucher au passé." },
    ],
  },

  // ═══ TUTORIELS ═══
  {
    id: 'tutoriels',
    titre: 'Tutoriels',
    managerOnly: false,
    blocs: [
      { type: 'callout', ton: 'info', icone: '📖', texte: "**À ne pas confondre avec cette page.** L'aide où vous êtes explique **Shiftly**. Les **Tutoriels**, eux, sont vos propres modes d'emploi maison, écrits par vous, pour votre équipe : comment monter la machine à granita, comment gérer un anniversaire, comment fermer la caisse." },
      { type: 'soustitre', texte: 'Ce que vous pouvez faire — gérant.' },
      { type: 'p', texte: "Écrire un tutoriel dans l'éditeur (**Réglages → Éditeur**) : titre, niveau (débutant, intermédiaire, avancé), étapes, images ou vidéos, encadrés d'astuce. Puis **suivre qui l'a lu**." },
      { type: 'soustitre', texte: 'Ce que vous pouvez faire — équipier.' },
      { type: 'p', texte: "Filtrer les tutos par zone et par niveau, les lire, et voir votre progression. Une lecture est enregistrée : c'est ce qui permet au gérant de savoir que la consigne est passée." },
      { type: 'figure', src: '/aide/tutoriels.jpg', url: '/tutoriels', alt: 'Tutoriels',
        legende: "Vos modes d'emploi maison. La barre de progression en haut suit ce que **vous** avez lu ; côté gérant, la même donnée dit qui dans l'équipe a pris connaissance de quoi.",
        pins: [] },
      { type: 'callout', ton: 'tip', texte: "Le meilleur moment pour écrire un tuto, c'est **juste après avoir expliqué la même chose pour la troisième fois**." },
      { type: 'callout', ton: 'tip', texte: "Un tuto bien fait remplace une formation. Reliez-le à la compétence correspondante : l'équipier lit, s'entraîne, vous validez." },
    ],
  },

  // ═══ HACCP ═══
  {
    id: 'haccp',
    titre: 'HACCP',
    managerOnly: false,
    blocs: [
      { type: 'soustitre', texte: 'À quoi ça sert.' },
      { type: 'p', texte: "Si vous servez à manger ou à boire, vous devez prouver que vous surveillez le froid. Shiftly transforme cette obligation en **missions normales du service**, avec la preuve horodatée qui va avec." },
      { type: 'soustitre', texte: 'Comment ça marche.' },
      { type: 'p', texte: "Vous déclarez vos **équipements froids** dans **HACCP → Équipements** — frigo, congélateur, vitrine — avec leurs seuils min et max. Shiftly génère alors automatiquement **deux missions de relevé par équipement**, une en début et une en fin de service. L'équipier les coche comme n'importe quelle mission, en saisissant la température lue." },
      { type: 'soustitre', texte: 'Pas à pas — déclarer un équipement.' },
      { type: 'etapes', items: [
        "**HACCP → Équipements**, puis **Ajouter**.",
        "Nom parlant — « Frigo bar principal », pas « Frigo 2 ».",
        "Type : frigo, congélateur, vitrine, autre.",
        "Seuils min et max en °C. C'est ici, et nulle part ailleurs, que se règlent les seuils.",
        "Enregistrez : les missions de relevé apparaissent au prochain service.",
      ] },
      { type: 'figure', src: '/aide/haccp-equipements.jpg', url: '/haccp · onglet Équipements', alt: 'HACCP — équipements et seuils',
        legende: "Vos équipements froids. **1** les seuils min et max : c'est ici, et nulle part ailleurs, qu'ils se règlent · **2** la synchronisation, qui crée deux missions de relevé par équipement actif. Elle est idempotente : la relancer ne duplique rien.",
        pins: [{ n: 1, x: 27, y: 28 }, { n: 2, x: 91, y: 19 }] },
      { type: 'soustitre', texte: 'Pas à pas — faire un relevé.' },
      { type: 'etapes', items: [
        "Dans le service du jour, ouvrez la mission de relevé.",
        "Saisissez la température lue.",
        "Ajoutez une photo si vous voulez la preuve visuelle.",
        "Validez. Si la valeur sort des seuils, le relevé est marqué **non conforme** et reste tracé.",
      ] },
      { type: 'figure', src: '/aide/haccp-registre.jpg', url: '/haccp · onglet Registre', alt: 'HACCP — registre des relevés',
        legende: "Le registre, filtrable par mois, par type et par statut, avec export PDF. Il se remplit tout seul à mesure que l'équipe coche les missions HACCP du service — ici il est encore vide, aucun relevé n'a été fait sur la période.",
        pins: [] },
      { type: 'callout', ton: 'warn', texte: "Un relevé hors seuil est **signalé, pas bloqué**. Shiftly enregistre la non-conformité — à vous d'agir sur le frigo. Ne saisissez jamais une valeur fausse pour faire passer la ligne au vert : c'est exactement la preuve qui vous protégerait en contrôle." },
      { type: 'callout', ton: 'tip', texte: "Désactiver un équipement archive ses missions sans effacer l'historique des relevés déjà faits." },
    ],
  },

  // ═══ REGISTRE ═══
  {
    id: 'registre',
    titre: 'Registre du personnel',
    managerOnly: true,
    blocs: [
      { type: 'soustitre', texte: 'À quoi ça sert.' },
      { type: 'p', texte: "Le registre unique du personnel est **obligatoire** (article L1221-13 du Code du travail) et doit être présentable à l'inspection du travail. Shiftly le tient à jour à partir des fiches staff et l'exporte en PDF." },
      { type: 'soustitre', texte: 'Ce que vous pouvez faire.' },
      { type: 'p', texte: "Compléter les informations légales de chaque salarié — date et lieu de naissance, sexe, nationalité, emploi occupé, adresse, entrée et sortie avec motif — et générer le PDF." },
      { type: 'soustitre', texte: 'Pas à pas — sortir le registre.' },
      { type: 'etapes', items: [
        "**Réglages → Registre du personnel**.",
        "Repérez les fiches incomplètes : les champs manquants sont signalés.",
        "Complétez-les depuis la fiche staff concernée.",
        "Exportez en PDF.",
      ] },
      { type: 'figure', src: '/aide/registre.jpg', url: '/reglages/registre', alt: 'Registre du personnel',
        legende: "Le registre unique, prêt à l'export. **1** l'indicateur de complétude par salarié — c'est lui qui vous dit ce qui manquerait lors d'un contrôle · **2** l'export PDF officiel.",
        pins: [{ n: 1, x: 38, y: 41 }, { n: 2, x: 91, y: 22 }] },
      { type: 'callout', ton: 'warn', texte: "Ces informations sont **réservées au gérant** : un équipier n'y a jamais accès, même sur sa propre fiche visible dans Staff." },
      { type: 'callout', ton: 'tip', texte: "Remplissez-les **à l'embauche**, pas le jour du contrôle. Cinq minutes par salarié quand il arrive, contre une soirée entière dans l'urgence." },
    ],
  },

  // ═══ RÉGLAGES ═══
  {
    id: 'reglages',
    titre: 'Réglages',
    managerOnly: false,
    blocs: [
      { type: 'soustitre', texte: 'Ce que vous pouvez faire — gérant.' },
      { type: 'liste', items: [
        "**Le centre** — nom, adresse, téléphone, site web, tenue de travail attendue.",
        "**Horaires** — jours d'ouverture et créneaux. Ils gouvernent la génération des services.",
        "**Incidents** — suivi et clôture de tout ce qui a été signalé.",
        "**Registre du personnel** — voir la rubrique dédiée.",
        "**Éditeur** — création des tutoriels.",
        "**Support** — ouvrir un ticket quand quelque chose ne va pas.",
      ] },
      { type: 'soustitre', texte: 'Ce que vous pouvez faire — équipier.' },
      { type: 'p', texte: "Votre profil et l'accès au **support**. Le thème — sombre, clair ou sable — se change directement en bas de la barre latérale, via **Apparence**." },
      { type: 'callout', ton: 'warn', texte: "Le **code de pointage ne se change pas ici**. Il se règle sur la fiche du salarié, dans **Staff → modifier un membre** — et donc uniquement par un gérant. Un équipier qui a oublié son code doit passer par vous." },
      { type: 'callout', ton: 'warn', texte: "Modifier vos horaires d'ouverture ne réécrit pas le passé, mais change les services à venir. Vérifiez votre planning après un changement d'horaires saisonnier." },
    ],
  },

  // ═══ NOTIONS CLÉS ═══
  {
    id: 'notions',
    titre: 'Les notions clés',
    managerOnly: false,
    blocs: [
      { type: 'soustitre', texte: 'Le jour actif bascule à 5h.' },
      { type: 'p', texte: "La journée d'exploitation ne suit pas le calendrier. Entre minuit et 4h59, Shiftly considère que vous êtes **encore dans la journée de la veille** — sinon un service qui ferme à 1h serait coupé en deux. À 5h00 pile, on passe au jour suivant. Dashboard, Service du jour et Services répondent tous la même chose à la même heure." },
      { type: 'soustitre', texte: "Le centre, c'est votre bulle." },
      { type: 'p', texte: "Chaque centre est totalement cloisonné : zones, staff, missions, plannings, pointages. Aucune donnée ne traverse d'un centre à l'autre, même sur un compte multi-centres. Si vous ne voyez pas quelque chose que vous attendiez, vérifiez d'abord sur quel centre vous êtes connecté." },
      { type: 'soustitre', texte: 'Deux rôles, deux applications.' },
      { type: 'tableau', entetes: ['Rôle', 'Ce qu\'il peut faire'], lignes: [
        ['**Manager**', 'Tout : paramétrage, planning, validation, registre, réglages du centre.'],
        ['**Employé**', 'Service du jour, pointage, son planning, staff et postes en lecture, tutoriels, HACCP, son profil.'],
      ] },
      { type: 'p', texte: "Un employé ne voit pas les entrées gérant dans le menu, et l'API les lui refuse aussi — masquer n'est pas protéger, les deux sont faits." },
      { type: 'soustitre', texte: 'Deux codes à ne pas confondre.' },
      { type: 'p', texte: "Le **mot de passe** sert à se connecter à Shiftly. Le **code de pointage à 4 chiffres** sert uniquement à pointer sur la borne. Ils sont indépendants : changer l'un ne change pas l'autre." },
      { type: 'soustitre', texte: 'Le taux de complétion.' },
      { type: 'p', texte: "C'est la part des missions du service qui ont été cochées. Il se recalcule en direct. Lu sur une journée il ne dit pas grand-chose ; lu sur un mois, il pointe précisément les créneaux et les zones où l'organisation lâche." },
      { type: 'soustitre', texte: 'Missions fixes ou ponctuelles.' },
      { type: 'p', texte: "Une mission **fixe** revient à chaque service — c'est votre routine. Une mission **ponctuelle** n'existe que pour un service donné — c'est l'exception du jour. Utiliser la seconde évite de polluer la première." },
      { type: 'soustitre', texte: 'Compétences, niveau et points.' },
      { type: 'p', texte: "Vous définissez les compétences par zone, avec une difficulté et des points. Le gérant valide celles qu'un équipier maîtrise. Son **niveau** est le rapport entre ce qu'il a validé et le total des compétences du centre — donc il bouge quand vous enrichissez le référentiel, pas seulement quand il progresse." },
    ],
  },

  // ═══ FAQ ═══
  {
    id: 'faq',
    titre: 'FAQ & dépannage',
    managerOnly: false,
    blocs: [
      { type: 'soustitre', texte: '« Le service affiché n\'est pas le bon jour. »' },
      { type: 'p', texte: "Il est sans doute entre minuit et 5h du matin. C'est normal : le jour actif bascule à 5h pour ne pas couper les services de nuit. Attendez 5h01." },
      { type: 'soustitre', texte: '« Mon planning est vide alors que je l\'ai fait. »' },
      { type: 'p', texte: "Il est resté en **brouillon**. Rouvrez la semaine et publiez-la — l'équipe ne voit que le publié." },
      { type: 'soustitre', texte: '« Un équipier n\'arrive pas à pointer. »' },
      { type: 'p', texte: "Il saisit probablement son mot de passe au lieu de son **code à 4 chiffres**. Le code se vérifie et se change par un gérant, dans **Staff → modifier un membre**." },
      { type: 'soustitre', texte: '« Quelqu\'un a oublié de pointer son départ. »' },
      { type: 'p', texte: "Ne créez pas un second pointage. Allez en **Validation hebdo**, ouvrez son détail, corrigez l'horaire en indiquant le motif. La correction est tracée." },
      { type: 'soustitre', texte: '« Une mission n\'apparaît pas dans le service. »' },
      { type: 'p', texte: "Trois causes, dans cet ordre : elle est **archivée** ; elle est **ponctuelle** et rattachée à un autre service ; ou sa **catégorie** ne correspond pas au moment que vous regardez." },
      { type: 'soustitre', texte: '« Le lundi est vide dans le planning. »' },
      { type: 'p', texte: "Votre centre est probablement fermé ce jour-là dans **Réglages → Horaires**. Un jour fermé ne génère pas de service." },
      { type: 'soustitre', texte: '« Un relevé de température est passé en rouge. »' },
      { type: 'p', texte: "La valeur est hors des seuils de l'équipement. Shiftly l'enregistre comme non conforme et n'efface rien : traitez le problème sur le frigo, pas dans l'app." },
      { type: 'soustitre', texte: '« Un équipier ne voit pas le Dashboard. »' },
      { type: 'p', texte: "Normal. Dashboard, Services, Validation hebdo et Registre sont réservés au rôle Manager." },
      { type: 'soustitre', texte: '« Le niveau de toute mon équipe a baissé d\'un coup. »' },
      { type: 'p', texte: "Vous venez d'ajouter des compétences. Le niveau est un ratio : agrandir le référentiel fait mécaniquement baisser le pourcentage de chacun. Personne n'a rien perdu." },
      { type: 'soustitre', texte: '« Je ne retrouve pas un salarié dans le planning. »' },
      { type: 'p', texte: "Son compte est peut-être **désactivé**, ou il est déclaré en **absence** sur la période. Vérifiez sa fiche dans Staff." },
      { type: 'soustitre', texte: '« Rien ne fonctionne comme prévu. »' },
      { type: 'p', texte: "Ouvrez un ticket depuis **Réglages → Support** en décrivant l'écran, l'heure et ce que vous attendiez. C'est le chemin le plus rapide." },
    ],
  },
]
