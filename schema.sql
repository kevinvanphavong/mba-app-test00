-- ============================================================
-- schema.sql — Shiftly
-- MySQL 8.0
-- Source de vérité du schéma de base de données.
-- La migration Doctrine (Version20260319000001.php) reflète ce fichier.
-- ============================================================

-- ============================================================
-- TABLE : centre
-- Un centre = un parc de loisirs (multi-tenant)
-- ============================================================

CREATE TABLE centre (
    id         INT AUTO_INCREMENT NOT NULL,
    nom        VARCHAR(100)        NOT NULL,
    slug       VARCHAR(120)        NOT NULL,
    created_at DATETIME            NOT NULL,   -- DateTimeImmutable
    UNIQUE KEY uniq_slug (slug),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : user
-- Staff member (Manager ou Employé) rattaché à un centre
-- ============================================================

CREATE TABLE `user` (
    id           INT AUTO_INCREMENT NOT NULL,
    centre_id    INT          NOT NULL,
    nom          VARCHAR(100) NOT NULL,
    email        VARCHAR(180) NOT NULL,
    password     VARCHAR(255) NOT NULL,          -- hashé via UserPasswordHasher
    roles        JSON         NOT NULL,           -- ex: ["ROLE_USER", "ROLE_MANAGER"]
    role         VARCHAR(20)  NOT NULL,           -- 'MANAGER' | 'EMPLOYE'
    avatar_color VARCHAR(20)  DEFAULT NULL,       -- couleur hex déterministe
    points       INT          NOT NULL DEFAULT 0, -- SUM des compétences validées
    created_at   DATETIME     NOT NULL,
    UNIQUE KEY uniq_email (email),
    INDEX idx_user_centre (centre_id),
    PRIMARY KEY (id),
    CONSTRAINT FK_user_centre FOREIGN KEY (centre_id) REFERENCES centre (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : zone
-- Zone de travail au sein d'un centre (Accueil, Bar, Salle, Manager)
-- ============================================================

CREATE TABLE zone (
    id        INT AUTO_INCREMENT NOT NULL,
    centre_id INT         NOT NULL,
    nom       VARCHAR(50) NOT NULL,
    couleur   VARCHAR(20) DEFAULT NULL,  -- ex: '#3b82f6'
    ordre     INT         NOT NULL DEFAULT 0,
    UNIQUE KEY uniq_zone_centre_nom (centre_id, nom),
    INDEX idx_zone_centre (centre_id),
    PRIMARY KEY (id),
    CONSTRAINT FK_zone_centre FOREIGN KEY (centre_id) REFERENCES centre (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : mission
-- Tâche rattachée à une zone, à compléter lors d'un service
-- type     : 'OUVERTURE' | 'SERVICE' | 'MENAGE' | 'FERMETURE'
-- priorite : 'vitale' | 'important' | 'ne_pas_oublier'
-- ============================================================

CREATE TABLE mission (
    id             INT AUTO_INCREMENT NOT NULL,
    zone_id        INT          NOT NULL,
    texte          VARCHAR(255) NOT NULL,
    type           VARCHAR(30)  NOT NULL,    -- catégorie dans le service
    priorite       VARCHAR(30)  NOT NULL,
    ordre          INT          NOT NULL DEFAULT 0,
    requires_photo TINYINT(1)   NOT NULL DEFAULT 0,  -- preuve photo requise pour valider
    INDEX idx_mission_zone (zone_id),
    PRIMARY KEY (id),
    CONSTRAINT FK_mission_zone FOREIGN KEY (zone_id) REFERENCES zone (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : competence
-- Compétence rattachée à une zone, validable pour un staff member
-- difficulte : 'simple' | 'avancee' | 'experimente'
-- points     : valeur ajoutée au score total de l'employé
-- ============================================================

CREATE TABLE competence (
    id         INT AUTO_INCREMENT NOT NULL,
    zone_id    INT          NOT NULL,
    nom        VARCHAR(150) NOT NULL,
    points     INT          NOT NULL DEFAULT 10,
    difficulte VARCHAR(30)  NOT NULL,
    INDEX idx_comp_zone (zone_id),
    PRIMARY KEY (id),
    CONSTRAINT FK_comp_zone FOREIGN KEY (zone_id) REFERENCES zone (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : staff_competence
-- Certification d'une compétence pour un utilisateur
-- Contrainte UNIQUE : un user ne peut valider une compétence qu'une fois
-- ============================================================

CREATE TABLE staff_competence (
    id            INT AUTO_INCREMENT NOT NULL,
    user_id       INT      NOT NULL,
    competence_id INT      NOT NULL,
    acquired_at   DATETIME NOT NULL,              -- DateTimeImmutable
    UNIQUE KEY uniq_staff_comp (user_id, competence_id),
    INDEX idx_sc_user (user_id),
    INDEX idx_sc_competence (competence_id),
    PRIMARY KEY (id),
    CONSTRAINT FK_sc_user       FOREIGN KEY (user_id)       REFERENCES `user`     (id),
    CONSTRAINT FK_sc_competence FOREIGN KEY (competence_id) REFERENCES competence (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : service
-- Service journalier d'un centre (un seul par jour par centre)
-- statut : 'PLANIFIE' | 'EN_COURS' | 'TERMINE'
-- ============================================================

CREATE TABLE service (
    id          INT AUTO_INCREMENT NOT NULL,
    centre_id   INT        NOT NULL,
    date        DATE       NOT NULL,
    heure_debut TIME       DEFAULT NULL,
    heure_fin   TIME       DEFAULT NULL,
    statut      VARCHAR(20) NOT NULL DEFAULT 'PLANIFIE',
    INDEX idx_service_centre (centre_id),
    PRIMARY KEY (id),
    CONSTRAINT FK_service_centre FOREIGN KEY (centre_id) REFERENCES centre (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : poste
-- Affectation d'un user à une zone pour un service donné
-- Contrainte UNIQUE : un user ne peut être affecté qu'une fois par service/zone
-- ============================================================

CREATE TABLE poste (
    id         INT AUTO_INCREMENT NOT NULL,
    service_id INT NOT NULL,
    zone_id    INT NOT NULL,
    user_id    INT NOT NULL,
    UNIQUE KEY uniq_poste (service_id, zone_id, user_id),
    INDEX idx_poste_service (service_id),
    INDEX idx_poste_zone    (zone_id),
    INDEX idx_poste_user    (user_id),
    PRIMARY KEY (id),
    CONSTRAINT FK_poste_service FOREIGN KEY (service_id) REFERENCES service (id),
    CONSTRAINT FK_poste_zone    FOREIGN KEY (zone_id)    REFERENCES zone    (id),
    CONSTRAINT FK_poste_user    FOREIGN KEY (user_id)    REFERENCES `user`  (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : completion
-- Cochage d'une mission dans le cadre d'un poste
-- Contrainte UNIQUE : une mission ne peut être cochée qu'une fois par poste
-- ============================================================

CREATE TABLE completion (
    id              INT AUTO_INCREMENT NOT NULL,
    poste_id        INT          NOT NULL,
    mission_id      INT          NOT NULL,
    user_id         INT          DEFAULT NULL,  -- qui a coché (peut être NULL si supprimé)
    completed_at    DATETIME     NOT NULL,      -- DateTimeImmutable
    -- Preuve photo (mission.requires_photo = 1) — NULL pour les missions sans preuve
    photo_path      VARCHAR(255) DEFAULT NULL,  -- chemin relatif: uploads/completion/YYYY/MM/uuid.jpg
    photo_mime_type VARCHAR(50)  DEFAULT NULL,  -- image/jpeg | image/png | image/webp
    photo_taken_at  DATETIME     DEFAULT NULL,  -- DateTimeImmutable
    UNIQUE KEY uniq_completion (poste_id, mission_id),
    INDEX idx_completion_poste   (poste_id),
    INDEX idx_completion_mission (mission_id),
    INDEX idx_completion_user    (user_id),
    PRIMARY KEY (id),
    CONSTRAINT FK_completion_poste   FOREIGN KEY (poste_id)   REFERENCES poste   (id),
    CONSTRAINT FK_completion_mission FOREIGN KEY (mission_id) REFERENCES mission  (id),
    CONSTRAINT FK_completion_user    FOREIGN KEY (user_id)    REFERENCES `user`   (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : incident
-- Incident signalé lors d'un service
-- severite : 'haute' | 'moyenne' | 'basse'
-- statut   : 'ouvert' | 'en_cours' | 'resolu'
-- ============================================================

CREATE TABLE incident (
    id          INT AUTO_INCREMENT NOT NULL,
    centre_id   INT          NOT NULL,
    service_id  INT          DEFAULT NULL,   -- service lors duquel l'incident est survenu
    user_id     INT          DEFAULT NULL,   -- qui a signalé
    titre       VARCHAR(255) NOT NULL,
    severite    VARCHAR(20)  NOT NULL DEFAULT 'moyenne',
    statut      VARCHAR(20)  NOT NULL DEFAULT 'ouvert',
    created_at  DATETIME     NOT NULL,
    resolved_at DATETIME     DEFAULT NULL,
    INDEX idx_incident_centre  (centre_id),
    INDEX idx_incident_service (service_id),
    INDEX idx_incident_user    (user_id),
    INDEX idx_incident_statut  (statut),
    PRIMARY KEY (id),
    CONSTRAINT FK_incident_centre  FOREIGN KEY (centre_id)  REFERENCES centre  (id),
    CONSTRAINT FK_incident_service FOREIGN KEY (service_id) REFERENCES service (id),
    CONSTRAINT FK_incident_user    FOREIGN KEY (user_id)    REFERENCES `user`  (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : tutoriel
-- Contenu de formation rattaché à un centre
-- niveau   : 'debutant' | 'intermediaire' | 'avance'
-- contenu  : JSON (étapes structurées : titre, texte, tips...)
-- ============================================================

CREATE TABLE tutoriel (
    id         INT AUTO_INCREMENT NOT NULL,
    centre_id  INT          NOT NULL,
    titre      VARCHAR(200) NOT NULL,
    zone       VARCHAR(50)  DEFAULT NULL,   -- nom de la zone cible (dénormalisé)
    niveau     VARCHAR(20)  NOT NULL DEFAULT 'debutant',
    dure_min   INT          DEFAULT NULL,   -- durée estimée en minutes
    contenu    JSON         NOT NULL,
    created_at DATETIME     NOT NULL,
    INDEX idx_tutoriel_centre (centre_id),
    PRIMARY KEY (id),
    CONSTRAINT FK_tutoriel_centre FOREIGN KEY (centre_id) REFERENCES centre (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : tuto_read
-- Suivi de lecture des tutoriels par les employés
-- Contrainte UNIQUE : un user ne marque lu un tutoriel qu'une fois
-- ============================================================

CREATE TABLE tuto_read (
    id          INT AUTO_INCREMENT NOT NULL,
    user_id     INT      NOT NULL,
    tutoriel_id INT      NOT NULL,
    read_at     DATETIME NOT NULL,    -- DateTimeImmutable
    UNIQUE KEY uniq_tutoread (user_id, tutoriel_id),
    INDEX idx_tutoread_user     (user_id),
    INDEX idx_tutoread_tutoriel (tutoriel_id),
    PRIMARY KEY (id),
    CONSTRAINT FK_tutoread_user     FOREIGN KEY (user_id)     REFERENCES `user`    (id),
    CONSTRAINT FK_tutoread_tutoriel FOREIGN KEY (tutoriel_id) REFERENCES tutoriel  (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DONNÉES INITIALES — Centre pilote
-- ============================================================

INSERT INTO centre (nom, slug, created_at) VALUES
    ('Bowling Central', 'bowling-central', NOW());

-- Zones de Bowling Central
-- (à insérer après avoir récupéré l'id du centre)
-- INSERT INTO zone (centre_id, nom, couleur, ordre) VALUES
--     (1, 'Accueil', '#3b82f6', 1),
--     (1, 'Bar',     '#a855f7', 2),
--     (1, 'Salle',   '#22c55e', 3),
--     (1, 'Manager', '#f97316', 4);

-- Users et données réelles → insérer via fixtures Alice (shiftly-api/fixtures/)
-- Les mots de passe doivent être hashés via UserPasswordHasher
-- Format email : prenom@fgc.fr (ex: kevin@fgc.fr)
-- Format mot de passe fixture : prenom123

-- ============================================================
-- TABLE : planning_week
-- Statut de publication d'une semaine de planning pour un centre.
-- Une semaine sans entrée est implicitement BROUILLON.
-- ============================================================

CREATE TABLE planning_week (
    id               INT AUTO_INCREMENT NOT NULL,
    centre_id        INT          NOT NULL,
    week_start       DATE         NOT NULL COMMENT '(DC2Type:date_immutable) — toujours un lundi',
    statut           VARCHAR(20)  NOT NULL DEFAULT 'BROUILLON',  -- BROUILLON | PUBLIE
    published_at     DATETIME     DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)',
    published_by     INT          DEFAULT NULL,
    note             TEXT         DEFAULT NULL,
    -- Bumpé par PlanningWeekDirtyListener à chaque mutation Poste/Absence.
    -- Si last_modified_at > published_at → modifs non publiées (le staff voit
    -- une version périmée tant qu'on n'a pas republié).
    last_modified_at DATETIME     DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)',
    UNIQUE KEY uniq_pw_centre_week (centre_id, week_start),
    INDEX idx_pw_centre (centre_id),
    INDEX idx_pw_published_by (published_by),
    PRIMARY KEY (id),
    CONSTRAINT FK_pw_centre       FOREIGN KEY (centre_id)    REFERENCES centre (id),
    CONSTRAINT FK_pw_published_by FOREIGN KEY (published_by) REFERENCES `user` (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : planning_snapshot
-- Archivage légal immuable de chaque publication de planning.
-- Conservation minimum 3 ans (prescription prud'homale heures sup).
-- SHA-256 garantit l'intégrité du contenu après archivage.
-- ============================================================

CREATE TABLE planning_snapshot (
    id                 INT AUTO_INCREMENT NOT NULL,
    centre_id          INT          NOT NULL,
    week_start         DATE         NOT NULL COMMENT '(DC2Type:date_immutable)',
    published_at       DATETIME     NOT NULL COMMENT '(DC2Type:datetime_immutable)',
    published_by       INT          NOT NULL,
    data               JSON         NOT NULL,            -- copie intégrale PlanningWeekData
    motif_modification TEXT         DEFAULT NULL,        -- obligatoire si délai < 7j
    checksum           VARCHAR(64)  NOT NULL,            -- SHA-256 du JSON data
    delai_respect      TINYINT(1)   NOT NULL DEFAULT 1,  -- false si publié à < 7j calendaires
    INDEX idx_ps_centre_week (centre_id, week_start),
    INDEX idx_ps_published_by (published_by),
    PRIMARY KEY (id),
    CONSTRAINT FK_ps_centre       FOREIGN KEY (centre_id)    REFERENCES centre (id),
    CONSTRAINT FK_ps_published_by FOREIGN KEY (published_by) REFERENCES `user` (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : planning_template
-- Modèle de planning hebdomadaire réutilisable (semaine type).
-- Scopé à un centre. Unicité (centre_id, nom).
-- ============================================================

CREATE TABLE planning_template (
    id            INT AUTO_INCREMENT NOT NULL,
    centre_id     INT          NOT NULL,
    created_by_id INT          NOT NULL,
    nom           VARCHAR(100) NOT NULL,
    created_at    DATETIME     NOT NULL,
    UNIQUE KEY  uniq_planning_template_centre_nom (centre_id, nom),
    INDEX IDX_PT_CENTRE (centre_id),
    INDEX IDX_PT_CREATED_BY (created_by_id),
    PRIMARY KEY (id),
    CONSTRAINT FK_PT_CENTRE     FOREIGN KEY (centre_id)     REFERENCES centre (id),
    CONSTRAINT FK_PT_CREATED_BY FOREIGN KEY (created_by_id) REFERENCES `user` (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : planning_template_shift
-- Shift d'un template (zone + user nullable + dayOfWeek + horaires).
-- ON DELETE SET NULL sur user → le template survit au turnover.
-- ============================================================

CREATE TABLE planning_template_shift (
    id            INT AUTO_INCREMENT NOT NULL,
    template_id   INT          NOT NULL,
    zone_id       INT          NOT NULL,
    user_id       INT          DEFAULT NULL,
    day_of_week   SMALLINT     NOT NULL,            -- 0 = lundi, 6 = dimanche
    heure_debut   TIME         DEFAULT NULL,
    heure_fin     TIME         DEFAULT NULL,
    pause_minutes INT          NOT NULL DEFAULT 0,
    INDEX IDX_PTS_TEMPLATE (template_id),
    INDEX IDX_PTS_ZONE (zone_id),
    INDEX IDX_PTS_USER (user_id),
    PRIMARY KEY (id),
    CONSTRAINT FK_PTS_TEMPLATE FOREIGN KEY (template_id) REFERENCES planning_template (id) ON DELETE CASCADE,
    CONSTRAINT FK_PTS_ZONE     FOREIGN KEY (zone_id)     REFERENCES zone (id),
    CONSTRAINT FK_PTS_USER     FOREIGN KEY (user_id)     REFERENCES `user` (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : planning_template_absence
-- Absence figée dans un template (REPOS, CP, RTT, MALADIE, etc.)
-- À l'application sur une semaine cible, génère une Absence réelle.
-- ON DELETE SET NULL sur user → robuste au turnover comme les shifts.
-- ============================================================

CREATE TABLE planning_template_absence (
    id          INT AUTO_INCREMENT NOT NULL,
    template_id INT          NOT NULL,
    user_id     INT          DEFAULT NULL,
    day_of_week SMALLINT     NOT NULL,            -- 0 = lundi, 6 = dimanche
    type        VARCHAR(30)  NOT NULL,            -- 'CP' | 'RTT' | 'MALADIE' | 'REPOS' | 'EVENEMENT_FAMILLE' | 'AUTRE'
    motif       VARCHAR(255) DEFAULT NULL,
    INDEX IDX_PTA_TEMPLATE (template_id),
    INDEX IDX_PTA_USER (user_id),
    PRIMARY KEY (id),
    CONSTRAINT FK_PTA_TEMPLATE FOREIGN KEY (template_id) REFERENCES planning_template (id) ON DELETE CASCADE,
    CONSTRAINT FK_PTA_USER     FOREIGN KEY (user_id)     REFERENCES `user` (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : absence
-- Absence journalière d'un employé (CP, RTT, maladie, repos planifié…)
-- Contrainte UNIQUE (user_id, date) : une seule absence par jour par employé.
-- type : 'CP' | 'RTT' | 'MALADIE' | 'REPOS' | 'EVENEMENT_FAMILLE' | 'AUTRE'
-- ============================================================

CREATE TABLE absence (
    id          INT AUTO_INCREMENT NOT NULL,
    centre_id   INT          NOT NULL,
    user_id     INT          NOT NULL,
    date        DATE         NOT NULL COMMENT '(DC2Type:date_immutable)',
    type        VARCHAR(30)  NOT NULL,
    motif       VARCHAR(255) DEFAULT NULL,
    created_at  DATETIME     NOT NULL COMMENT '(DC2Type:datetime_immutable)',
    created_by  INT          DEFAULT NULL,
    UNIQUE KEY  uniq_absence_user_date (user_id, date),
    INDEX idx_absence_centre (centre_id),
    INDEX idx_absence_user   (user_id),
    INDEX idx_absence_date   (date),
    PRIMARY KEY (id),
    CONSTRAINT FK_absence_centre     FOREIGN KEY (centre_id)  REFERENCES centre (id),
    CONSTRAINT FK_absence_user       FOREIGN KEY (user_id)    REFERENCES `user` (id),
    CONSTRAINT FK_absence_created_by FOREIGN KEY (created_by) REFERENCES `user` (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : validation_hebdo
-- Validation hebdomadaire par employé par semaine (lundi ISO).
-- statut : 'EN_ATTENTE' | 'VALIDEE' | 'CORRIGEE'
-- Heures stockées en minutes (INT) pour éviter les flottants.
-- ============================================================

CREATE TABLE validation_hebdo (
    id                  INT AUTO_INCREMENT NOT NULL,
    centre_id           INT          NOT NULL,
    user_id             INT          NOT NULL,
    semaine             DATE         NOT NULL COMMENT '(DC2Type:date_immutable)',   -- lundi de la semaine ISO
    statut              VARCHAR(20)  NOT NULL DEFAULT 'EN_ATTENTE',
    heures_travaillees  INT          NOT NULL DEFAULT 0,   -- minutes réelles
    heures_prevues      INT          NOT NULL DEFAULT 0,   -- minutes planning
    ecart               INT          NOT NULL DEFAULT 0,   -- réel - prévu (minutes)
    heures_sup          INT          NOT NULL DEFAULT 0,   -- minutes >heures_prevues
    note                VARCHAR(500) DEFAULT NULL,
    validated_by        INT          DEFAULT NULL,
    validated_at        DATETIME     DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)',
    created_at          DATETIME     NOT NULL              COMMENT '(DC2Type:datetime_immutable)',
    updated_at          DATETIME     DEFAULT NULL          COMMENT '(DC2Type:datetime_immutable)',
    UNIQUE KEY uniq_validation_user_semaine (centre_id, user_id, semaine),
    INDEX idx_validation_centre  (centre_id),
    INDEX idx_validation_user    (user_id),
    INDEX idx_validation_semaine (semaine),
    PRIMARY KEY (id),
    CONSTRAINT FK_vh_centre       FOREIGN KEY (centre_id)   REFERENCES centre (id),
    CONSTRAINT FK_vh_user         FOREIGN KEY (user_id)     REFERENCES `user` (id),
    CONSTRAINT FK_vh_validated_by FOREIGN KEY (validated_by) REFERENCES `user` (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : correction_pointage
-- Trace des corrections manuelles de pointage par les managers.
-- champ_modifie : 'heureArrivee' | 'heureDepart' | 'pauseDebut' | 'pauseFin'
-- ============================================================

CREATE TABLE correction_pointage (
    id               INT AUTO_INCREMENT NOT NULL,
    centre_id        INT          NOT NULL,
    pointage_id      INT          NOT NULL,
    champ_modifie    VARCHAR(50)  NOT NULL,
    ancienne_valeur  DATETIME     DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)',
    nouvelle_valeur  DATETIME     DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)',
    motif            VARCHAR(255) DEFAULT NULL,
    corrige_par_id   INT          NOT NULL,
    corrige_at       DATETIME     NOT NULL COMMENT '(DC2Type:datetime_immutable)',
    INDEX idx_cp_centre   (centre_id),
    INDEX idx_cp_pointage (pointage_id),
    PRIMARY KEY (id),
    CONSTRAINT FK_cp_centre       FOREIGN KEY (centre_id)      REFERENCES centre (id),
    CONSTRAINT FK_cp_corrige_par  FOREIGN KEY (corrige_par_id) REFERENCES `user` (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SUPERADMIN — Phase 1
-- ============================================================

ALTER TABLE centre ADD COLUMN actif TINYINT(1) NOT NULL DEFAULT 1;

CREATE TABLE audit_log (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    super_admin_user_id INT UNSIGNED NOT NULL,
    action          VARCHAR(100) NOT NULL,
    target_type     VARCHAR(50)  NOT NULL,
    target_id       INT UNSIGNED,
    metadata        JSON,
    ip              VARCHAR(45),
    user_agent      VARCHAR(255),
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_log_user FOREIGN KEY (super_admin_user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE centre_note (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    centre_id           INT UNSIGNED NOT NULL,
    super_admin_user_id INT UNSIGNED NOT NULL,
    contenu             TEXT NOT NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_centre_note_centre FOREIGN KEY (centre_id)           REFERENCES centre(id),
    CONSTRAINT fk_centre_note_user   FOREIGN KEY (super_admin_user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- NOTES MÉTIER
-- ============================================================

-- Calcul des points staff :
--   user.points = COUNT/SUM des compétences validées dans staff_competence
--   Recalcul déclenché côté Symfony à chaque ajout/suppression de StaffCompetence
--   Ne jamais calculer côté frontend

-- Multi-tenant :
--   Chaque entité est isolée par centre_id
--   Le JWT embarque centre_id → API Platform filtre automatiquement

-- Contenu tutoriel (JSON) — structure recommandée :
-- {
--   "etapes": [
--     { "titre": "Introduction", "texte": "...", "tips": ["..."] },
--     { "titre": "Étape 2", "texte": "...", "tips": [] }
--   ]
-- }
