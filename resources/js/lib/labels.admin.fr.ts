// Exact UI copy for the admin panel (French only). Public copy stays in labels.fr.ts.

export const adminLabels = {
    titleSuffix: 'Administration',
    badge: 'Admin',
    fields: {
        email: 'Adresse email',
        password: 'Mot de passe',
        showPassword: 'Afficher le mot de passe',
        hidePassword: 'Masquer le mot de passe',
    },
    login: {
        title: 'Connexion',
        forgotPassword: 'Mot de passe oublié ?',
        remember: 'Se souvenir de moi',
        submit: 'Se connecter',
    },
    twoFactorChallenge: {
        title: 'Vérification en deux étapes',
        intro: 'Saisissez le code à 6 chiffres affiché par votre application d’authentification.',
        recoveryIntro:
            'Saisissez l’un des codes de récupération enregistrés lors de l’activation. Chaque code ne sert qu’une fois.',
        code: 'Code de vérification',
        recoveryCode: 'Code de récupération',
        submit: 'Vérifier',
        useRecoveryCode: 'Utiliser un code de récupération',
        useAppCode: 'Utiliser le code de l’application',
    },
    forgotPassword: {
        title: 'Mot de passe oublié',
        back: 'Retour à la connexion',
        intro: 'Saisissez votre adresse de connexion. Un lien de réinitialisation, valable 60 minutes, sera envoyé à cette adresse et à votre email de récupération.',
        submit: 'Envoyer le lien',
    },
    resetPassword: {
        title: 'Nouveau mot de passe',
        password: 'Nouveau mot de passe',
        passwordHelp:
            '12 caractères minimum, avec majuscules, minuscules, chiffres et symboles.',
        confirmation: 'Confirmation du mot de passe',
        submit: 'Réinitialiser le mot de passe',
    },
    shell: {
        skipToContent: 'Aller au contenu',
        nav: 'Administration',
        drawerNav: 'Menu',
        menu: 'Menu',
        openMenu: 'Ouvrir le menu',
        closeMenu: 'Fermer le menu',
        collapseSidebar: 'Réduire la barre latérale',
        expandSidebar: 'Étendre la barre latérale',
        articles: 'Articles',
        categories: 'Catégories',
        subscriptions: 'Abonnements',
        account: 'Compte',
        viewSite: 'Voir le site',
        newTab: '(nouvel onglet)',
        logout: 'Se déconnecter',
    },
    placeholder: 'Cette section arrive bientôt.',
    modal: {
        close: 'Fermer',
        cancel: 'Annuler',
        save: 'Enregistrer',
    },
    editor: {
        createTitle: 'Nouvel article',
        editTitle: 'Modifier l’article',
        back: 'Retour aux articles',
        save: 'Enregistrer',
        publish: 'Publier',
        archive: 'Archiver',
        preview: 'Aperçu',
        moreActions: 'Plus d’actions',
        actionsMenu: 'Actions de l’article',
        title: 'Titre',
        chapo: 'Chapô',
        cover: 'Image de couverture',
        coverCredit: 'Crédit photo',
        content: 'Contenu',
        contentHelp:
            'Formats : Paragraphe, Titre 1 (h2), Titre 2 (h3), Titre 3 (h4). « Encadré » dans Styles, affiché comme sur le site. Images : texte alternatif obligatoire (ou décorative), légende possible.',
        wordCount: (words: number, minutes: number) =>
            `${words} ${words > 1 ? 'mots' : 'mot'} · ${minutes} min de lecture`,
        classification: 'Classement',
        categories: 'Catégories',
        categoriesPlaceholder: 'Rechercher ou créer…',
        createCategory: (name: string) => `Créer « ${name} »`,
        removeCategory: (name: string) => `Retirer ${name}`,
        noCategoryMatch: 'Aucune catégorie ne correspond.',
        seo: 'Référencement',
        description: 'Description SEO',
        descriptionHelp: (count: number) =>
            `Ce champ n’apparaît pas dans l’article mais améliore le référencement. ${count}/160 caractères`,
        keywords: 'Mots-clés',
        keywordsHelp: 'Séparez les mots-clés par des virgules',
        slug: 'URL de l’article',
        slugHelp:
            'Figée après la première publication. Un changement ensuite redirige l’ancienne adresse (301).',
        autosavedAt: (time: string) =>
            `Brouillon enregistré automatiquement dans le navigateur à ${time}.`,
        restoreTitle: (time: string) =>
            `Une version plus récente, enregistrée dans ce navigateur à ${time}, n’a pas été envoyée.`,
        restoreCoverNote:
            'L’image de couverture choisie n’y est pas conservée.',
        restore: 'Restaurer',
        discard: 'Ignorer',
        leaveTitle: 'Quitter sans enregistrer ?',
        leaveDescription:
            'Les modifications non enregistrées seront perdues. Une copie reste dans ce navigateur.',
        leaveConfirm: 'Quitter la page',
    },
    wordImport: {
        open: 'Importer depuis Word',
        title: 'Importer depuis Word',
        intro: 'Le document pré-remplit le formulaire ; rien n’est enregistré automatiquement.',
        templateIntro:
            'Partez du modèle : écrivez sous les repères [Titre], [Chapô] et [Corps], et entourez un encadré de [Encadré] et [Fin encadré].',
        templateLink: 'Télécharger le modèle (.docx)',
        choose: 'Choisir un fichier .docx',
        dropHint: 'ou le déposer ici · 20 Mo maximum',
        imagesNote:
            'Les images ne sont pas importées : ajoutez-les ensuite dans l’éditeur.',
        change: 'Changer',
        changeLabel: (name: string) => `Changer de fichier (${name})`,
        checking: 'Vérification du document…',
        invalidFile:
            'Le fichier n’a pas pu être importé. Vérifiez qu’il s’agit bien d’un document Word (.docx).',
        checkFailed:
            'La vérification n’a pas abouti. Réessayez dans quelques instants.',
        errorsTitle:
            'Le document ne peut pas être importé. Corrigez-le dans Word, puis choisissez-le à nouveau.',
        readyTitle: 'Document prêt à être importé',
        summaryTitle: (title: string) => `Titre : « ${title} »`,
        summaryChapo: (paragraphs: number) =>
            paragraphs === 0
                ? 'Chapô : vide'
                : `Chapô : ${paragraphs} ${paragraphs > 1 ? 'paragraphes' : 'paragraphe'}`,
        summaryContent: (words: number, headings: number, callouts: number) => {
            const parts = [`${words} ${words > 1 ? 'mots' : 'mot'}`];

            if (headings > 0) {
                parts.push(
                    `${headings} ${headings > 1 ? 'intertitres' : 'intertitre'}`,
                );
            }

            if (callouts > 0) {
                parts.push(
                    `${callouts} ${callouts > 1 ? 'encadrés' : 'encadré'}`,
                );
            }

            return `Contenu : ${parts.join(', ')}`;
        },
        replaceNotice:
            'Le formulaire contient déjà du texte : l’import remplacera le titre, le chapô et le contenu.',
        submit: 'Importer',
        replace: 'Remplacer le contenu',
        imported:
            'Document importé. Ajoutez l’image de couverture, puis générez la description et les mots-clés.',
    },
    suggestions: {
        generate: 'Générer avec l’IA',
        help: 'Propose une description SEO et des mots-clés à partir du titre, du chapô et du contenu.',
        missingText: 'Ajoutez d’abord le titre et le contenu de l’article.',
        failed: 'La génération n’a pas abouti. Réessayez dans quelques instants.',
        replaceTitle: 'Remplacer la description et les mots-clés ?',
        replaceDescription:
            'Les textes actuels seront remplacés par les propositions. Vous pourrez encore les modifier avant d’enregistrer.',
        replace: 'Remplacer',
    },
    accessibilityWarnings: {
        title: 'Article enregistré. Quelques points d’accessibilité à vérifier dans le contenu :',
        note: 'Ces points n’empêchent ni l’enregistrement ni la publication.',
    },
    imageUploader: {
        drop: 'Glissez une image ici ou cliquez pour en choisir une',
        help: 'JPG, PNG ou WebP, 10 Mo maximum. Paysage, 1600 px de large au moins.',
        replace: 'Remplacer',
        remove: 'Retirer',
        preview: (label: string) => `Aperçu : ${label.toLowerCase()}`,
        currentImage: 'Image actuelle',
        invalidType: 'Le fichier doit être une image JPG, PNG ou WebP.',
        tooLarge: 'L’image ne doit pas dépasser 10 Mo.',
    },
    richText: {
        loading: 'Chargement de l’éditeur…',
        encadre: 'Encadré',
        blockFormats: 'Paragraphe=p; Titre 1=h2; Titre 2=h3; Titre 3=h4',
        newsletterBlockFormats: 'Paragraphe=p; Titre 1=h2; Titre 2=h3',
        uploadFailed:
            'L’image n’a pas pu être envoyée. Réessayez dans quelques instants.',
        sessionExpired: 'La page a expiré. Rechargez-la, puis réessayez.',
    },
    articles: {
        title: 'Articles',
        create: 'Créer un article',
        search: 'Rechercher par titre',
        searchPlaceholder: 'Rechercher par titre…',
        statusFilter: 'Filtrer par statut',
        statusFilters: {
            all: 'Tous',
            draft: 'Brouillons',
            published: 'Publiés',
            archived: 'Archivés',
        },
        status: {
            DRAFT: 'Brouillon',
            PUBLISHED: 'Publié',
            ARCHIVED: 'Archivé',
        },
        count: (count: number) =>
            `${count} ${count > 1 ? 'articles' : 'article'}`,
        createdOn: (date: string) => `Créé le ${date}`,
        columns: {
            title: 'Titre',
            date: 'Date de publication',
            categories: 'Catégories',
            status: 'Statut',
            actions: 'Actions',
        },
        actionsMenu: 'Actions de l’article',
        actionsFor: (title: string) => `Actions pour « ${title} »`,
        edit: 'Modifier',
        preview: 'Aperçu',
        openPreviewInNewTab: 'Ouvrir l’aperçu dans un nouvel onglet',
        previewFrame: (title: string) => `Aperçu de « ${title} »`,
        publish: 'Publier',
        archive: 'Archiver',
        delete: 'Supprimer',
        deleteTitle: (title: string) => `Supprimer « ${title} » ?`,
        deleteDescription:
            'Le brouillon sera supprimé. Cette action ne peut pas être annulée depuis l’administration.',
        empty: 'Aucun article pour le moment.',
        noMatch: 'Aucun article ne correspond à votre recherche.',
    },
    categories: {
        title: 'Catégories',
        create: 'Créer une catégorie',
        editTitle: 'Modifier la catégorie',
        nameField: 'Nom de la catégorie',
        edit: 'Modifier',
        delete: 'Supprimer',
        editNamed: (name: string) => `Modifier ${name}`,
        deleteNamed: (name: string) => `Supprimer ${name}`,
        deleteTitle: (name: string) => `Supprimer « ${name} » ?`,
        deleteUsage: (count: number) =>
            `Cette catégorie est utilisée par ${count} article(s). Elle sera retirée de ces articles.`,
        search: 'Rechercher par nom',
        searchPlaceholder: 'Rechercher par nom…',
        count: (count: number) =>
            `${count} ${count > 1 ? 'catégories' : 'catégorie'}`,
        sortBy: 'Trier par',
        sortName: 'Nom',
        sortDate: 'Date',
        columns: {
            name: 'Nom',
            date: 'Date de création',
            articles: 'Articles',
            actions: 'Actions',
        },
        mobileMeta: (articles: number, date: string | null) =>
            [
                `${articles} ${articles > 1 ? 'articles' : 'article'}`,
                date && `créée le ${date}`,
            ]
                .filter(Boolean)
                .join(' · '),
        empty: 'Aucune catégorie pour le moment.',
        noMatch: 'Aucune catégorie ne correspond à votre recherche.',
    },
    account: {
        title: 'Gestion du compte',
        tabs: 'Compte',
        profileTab: 'Profil',
        securityTab: 'Sécurité',
        edit: 'Modifier',
        editField: (label: string) => `Modifier : ${label.toLowerCase()}`,
        locked: 'Terminez d’abord la modification en cours',
        cancel: 'Annuler',
        save: 'Enregistrer',
        empty: 'Non renseigné',
        avatar: 'Avatar',
        avatarAlt: 'Avatar actuel',
        avatarCredit: (credit: string) => `Crédit photo : ${credit}`,
        noAvatar: 'Aucun avatar',
        pickImage: 'Choisir une image',
        pickOtherImage: 'Choisir une autre image',
        avatarHelp: 'JPG, PNG ou WebP, 2 Mo maximum. Recadrage carré.',
        avatarInvalidType: 'Le fichier doit être une image JPG, PNG ou WebP.',
        avatarTooLarge: 'L’image ne doit pas dépasser 2 Mo.',
        avatarUnreadable:
            'Cette image n’a pas pu être lue. Essayez-en une autre.',
        cropArea:
            'Zone de recadrage carrée. Faites glisser l’image, ou utilisez les flèches pour la déplacer et + ou − pour zoomer.',
        cropZoom: 'Zoom du recadrage',
        credit: 'Crédit photo',
        displayName: 'Nom d’affichage',
        displayNameHelp:
            '100 caractères maximum. Affiché en titre de la page de l’auteur.',
        biography: 'Biographie',
        loginEmail: 'Adresse email de connexion',
        loginEmailHelp:
            'Le changement demande votre mot de passe actuel et une confirmation par un lien envoyé à la nouvelle adresse.',
        newEmail: 'Nouvelle adresse email',
        currentPassword: 'Mot de passe actuel',
        sendLink: 'Envoyer le lien',
        leaveTitle: 'Quitter sans enregistrer ?',
        leaveDescription: 'La modification en cours sera perdue.',
        leaveConfirm: 'Quitter la page',
    },
    security: {
        recoveryEmail: 'Email de récupération',
        recoveryEmailHelp:
            'Sert à la réinitialisation du mot de passe et aux alertes de sécurité. Toute nouvelle adresse est vérifiée par un lien avant d’être active.',
        newRecoveryEmail: 'Adresse email de récupération',
        removeRecoveryEmail: 'Supprimer l’adresse',
        verified: 'Vérifié',
        unverified: 'Non vérifié',
        recoveryPhone: 'Téléphone de récupération',
        recoveryPhoneHelp:
            'Enregistré et affiché seulement : la vérification par SMS attend le choix d’un fournisseur.',
        recoveryPhoneShortHelp:
            'Enregistré seulement : pas encore de vérification par SMS.',
        phoneNumber: 'Numéro de téléphone',
        phoneNumberHelp:
            'Format international, par exemple +261 34 00 000 00. Laissez vide pour le supprimer.',
        password: 'Mot de passe',
        passwordMask: '••••••••••••',
        currentPassword: 'Mot de passe actuel',
        newPassword: 'Nouveau mot de passe',
        confirmPassword: 'Confirmer le nouveau mot de passe',
        passwordRules: {
            length: '12 caractères minimum',
            mixedCase: 'Majuscules et minuscules',
            number: 'Au moins un chiffre',
            symbol: 'Au moins un symbole',
            uncompromised:
                'Absent des fuites de données connues (vérifié à l’envoi)',
            met: 'respecté',
            unmet: 'non respecté',
        },
        otherDevicesLoggedOut: 'Les autres appareils seront déconnectés.',
        twoFactorTitle: 'Authentification à deux facteurs (2FA)',
        twoFactorEnabled: 'Activée',
        twoFactorDisabled: 'Désactivée',
        twoFactorPending: 'En cours d’activation',
        twoFactorHelp:
            'Chaque connexion demande, après le mot de passe, le code à 6 chiffres d’une application d’authentification.',
        twoFactorEnabledHelp:
            'Chaque connexion demande le code de votre application d’authentification, ou un code de récupération.',
        twoFactorPasswordHelp:
            'Saisissez votre mot de passe pour générer le QR code d’activation.',
        twoFactorContinue: 'Continuer',
        twoFactorScan:
            'Activation : scannez le QR code avec Google Authenticator, Authy, 1Password… puis saisissez le code à 6 chiffres.',
        twoFactorQrCode: 'QR code d’activation',
        twoFactorKey: 'Ou saisissez la clé :',
        twoFactorCode: 'Code de vérification',
        twoFactorEnable: 'Activer la 2FA',
        recoveryCodes: 'Codes de récupération',
        recoveryCodesHelp:
            'Gardez-les en lieu sûr. Chaque code ne sert qu’une fois. Ils ne seront plus affichés.',
        copyCodes: 'Copier',
        codesCopied: 'Codes copiés',
        downloadCodes: 'Télécharger',
        codesFileName: 'codes-recuperation-randy-donny.txt',
        done: 'Terminé',
        twoFactorManageHelp:
            'Saisissez votre mot de passe pour régénérer les codes de récupération ou désactiver la 2FA.',
        regenerateCodes: 'Régénérer les codes de récupération',
        disableTwoFactor: 'Désactiver la 2FA',
        devices: 'Appareils connectés',
        devicesCaption: 'Sessions ouvertes sur le compte',
        device: 'Appareil',
        ip: 'Adresse IP',
        lastActivity: 'Dernière activité',
        action: 'Action',
        thisDevice: 'Cet appareil',
        logOutDevice: 'Déconnecter',
        logOutDeviceLabel: (device: string) => `Déconnecter ${device}`,
        logOutDeviceTitle: 'Déconnecter cet appareil ?',
        logOutDeviceDescription: (device: string) =>
            `${device} devra se reconnecter avec le mot de passe.`,
        logOutOthers: 'Déconnecter tous les autres appareils',
        logOutOthersTitle: 'Déconnecter tous les autres appareils ?',
        logOutOthersDescription:
            'Seul cet appareil restera connecté. Les autres devront se reconnecter avec le mot de passe.',
        noOtherDevice: 'Aucun autre appareil n’est connecté.',
        history: 'Historique des connexions',
        historyCaption: 'Les 50 dernières connexions',
        date: 'Date',
        result: 'Résultat',
        twoFactor: '2FA',
        succeeded: 'Réussie',
        failed: 'Échouée',
        yes: 'Oui',
        no: 'Non',
        notApplicable: '—',
        historyHelp:
            'Les 50 dernières connexions. Une alerte email part lors d’une connexion depuis un nouvel appareil et à chaque changement de mot de passe ou de 2FA.',
        noHistory: 'Aucune connexion enregistrée pour le moment.',
        showMore: 'Afficher plus',
    },
};
