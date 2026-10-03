// Politique de confidentialité (French only). Typography (no-break spaces, apostrophes) is applied
// at render time by frenchTypography, not stored here. Update `updatedAt` with every change.

export type PolicyInline = string | { text: string; href: string };

export type PolicyBlock =
    | { type: 'paragraph'; content: PolicyInline[] }
    | { type: 'list'; items: PolicyInline[][] };

export type PolicySection = {
    id: string;
    title: string;
    blocks: PolicyBlock[];
};

const CONTACT_EMAIL = 'ranjamario@gmail.com';

const contactLink = { text: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` };

const paragraph = (...content: PolicyInline[]): PolicyBlock => ({
    type: 'paragraph',
    content,
});

const list = (...items: PolicyInline[][]): PolicyBlock => ({
    type: 'list',
    items,
});

export const privacyPolicy = {
    description:
        "Quelles données le site randy-donny.com collecte, pourquoi et combien de temps : mesure d'audience avec Google Analytics, newsletter, cookies et vos droits.",
    updatedAt: '3 octobre 2026',
    introduction:
        'Ce site est un blog personnel. Il collecte le moins de données possible : aucune publicité, aucun compte à créer, aucun commentaire. Cette page explique quelles données sont traitées, pourquoi, combien de temps elles sont conservées et comment exercer vos droits, conformément au Règlement général sur la protection des données (RGPD).',
    sections: [
        {
            id: 'responsable',
            title: 'Responsables du site',
            blocks: [
                paragraph(
                    'Le site randy-donny.com est conçu et exploité par Mario Randrianomearisoa, responsable du traitement des données. Pour toute question relative à vos données personnelles, vous pouvez écrire à ',
                    contactLink,
                    '.',
                ),
                paragraph(
                    "Randy Donny est l'auteur des articles publiés sur le site.",
                ),
            ],
        },
        {
            id: 'donnees-collectees',
            title: 'Données collectées',
            blocks: [
                paragraph('Le site traite deux types de données :'),
                list(
                    [
                        "des données de mesure d'audience, par Google Analytics, uniquement si vous l'acceptez ;",
                    ],
                    [
                        'votre adresse email, uniquement si vous vous abonnez à la newsletter.',
                    ],
                ),
                paragraph(
                    "Aucune autre donnée n'est collectée. Les données ne sont jamais vendues, louées ni utilisées à des fins publicitaires.",
                ),
            ],
        },
        {
            id: 'google-analytics',
            title: "Mesure d'audience (Google Analytics)",
            blocks: [
                paragraph(
                    "Pour savoir quels articles sont lus et améliorer le site, celui-ci utilise Google Analytics 4, un service fourni par Google Ireland Limited (Gordon House, Barrow Street, Dublin 4, Irlande). Google Analytics n'est chargé qu'après votre accord, donné dans le bandeau cookies. Si vous refusez, aucun cookie de mesure n'est déposé et aucune donnée n'est envoyée à Google.",
                ),
                paragraph('Si vous acceptez, Google Analytics collecte :'),
                list(
                    ['les pages consultées et la durée de la visite ;'],
                    [
                        'la page ou le site qui vous a amené ici (moteur de recherche, réseau social…) ;',
                    ],
                    [
                        "le type d'appareil, le système d'exploitation, le navigateur et la langue ;",
                    ],
                    [
                        'votre localisation approximative (pays, ville), déduite de votre adresse IP.',
                    ],
                ),
                paragraph(
                    "Google Analytics 4 n'enregistre ni ne conserve votre adresse IP. Les signaux Google et les fonctions publicitaires sont désactivés : les données ne servent qu'à des statistiques de fréquentation et ne sont pas croisées avec votre compte Google. Elles sont conservées 14 mois dans Google Analytics, puis supprimées.",
                ),
                paragraph(
                    'Google peut traiter ces données aux États-Unis. Ces transferts sont encadrés par le cadre de protection des données UE–États-Unis (Data Privacy Framework), auquel Google adhère, et par les clauses contractuelles types de la Commission européenne. Pour en savoir plus, consultez les ',
                    {
                        text: 'règles de confidentialité de Google',
                        href: 'https://policies.google.com/privacy?hl=fr',
                    },
                    '.',
                ),
                paragraph(
                    'Base légale : votre consentement (article 6.1.a du RGPD), que vous pouvez retirer à tout moment.',
                ),
            ],
        },
        {
            id: 'cookies',
            title: 'Cookies',
            blocks: [
                paragraph(
                    "Un cookie est un petit fichier enregistré par votre navigateur. Lors de votre première visite, un bandeau vous propose d'accepter ou de refuser la mesure d'audience ; refuser est aussi simple qu'accepter, et le site fonctionne de la même façon dans les deux cas.",
                ),
                paragraph('Les cookies utilisés sont les suivants :'),
                list(
                    [
                        'un cookie technique qui mémorise votre choix (acceptation ou refus) pendant 6 mois, pour ne pas vous reposer la question à chaque visite. Il ne contient aucune donnée personnelle ;',
                    ],
                    [
                        'les cookies _ga et _ga_<identifiant> de Google Analytics, déposés seulement si vous acceptez, pour distinguer les visiteurs de façon anonyme. Ils expirent au bout de 13 mois.',
                    ],
                ),
                paragraph(
                    "Vous pouvez changer d'avis à tout moment : supprimez les cookies de randy-donny.com dans les réglages de votre navigateur, et le bandeau vous sera proposé de nouveau. Vous pouvez aussi bloquer Google Analytics sur tous les sites avec le ",
                    {
                        text: 'module de désactivation de Google Analytics',
                        href: 'https://tools.google.com/dlpage/gaoptout?hl=fr',
                    },
                    '.',
                ),
            ],
        },
        {
            id: 'newsletter',
            title: 'Newsletter',
            blocks: [
                paragraph(
                    "Si vous vous abonnez à la newsletter, seule votre adresse email est enregistrée. Elle sert uniquement à vous envoyer les nouveaux articles de Randy Donny. Après votre inscription, un email de confirmation vous est envoyé : votre abonnement n'est activé que lorsque vous cliquez sur le lien qu'il contient (double confirmation). Sans confirmation, l'adresse est supprimée.",
                ),
                paragraph(
                    "Chaque email contient un lien « Se désabonner ». Dès votre désabonnement, votre adresse est supprimée. Elle n'est jamais transmise à des tiers, en dehors du prestataire technique qui assure l'envoi des emails pour le compte du site.",
                ),
                paragraph(
                    'Base légale : votre consentement (article 6.1.a du RGPD), que vous retirez en vous désabonnant.',
                ),
            ],
        },
        {
            id: 'hebergement',
            title: 'Hébergement',
            blocks: [
                paragraph(
                    'Le site et ses données sont hébergés sur un serveur privé virtuel (VPS) fourni par Hostinger International Ltd, 61 Lordou Vironos Street, 6023 Larnaca, Chypre. Comme tout serveur web, il enregistre temporairement des journaux techniques (adresse IP, page demandée, date) pour assurer la sécurité et le bon fonctionnement du site.',
                ),
            ],
        },
        {
            id: 'conservation',
            title: 'Durées de conservation',
            blocks: [
                list(
                    ["Données de mesure d'audience : 14 mois."],
                    ['Cookies Google Analytics : 13 mois au plus.'],
                    ['Cookie mémorisant votre choix : 6 mois.'],
                    [
                        "Adresse email de la newsletter : jusqu'à votre désabonnement, ou supprimée si l'abonnement n'est pas confirmé.",
                    ],
                    ['Journaux techniques du serveur : 12 mois au plus.'],
                ),
            ],
        },
        {
            id: 'droits',
            title: 'Vos droits',
            blocks: [
                paragraph(
                    'Conformément au RGPD, vous disposez des droits suivants sur vos données :',
                ),
                list(
                    ["droit d'accès et de rectification ;"],
                    ["droit à l'effacement ;"],
                    ["droit d'opposition et de limitation du traitement ;"],
                    ['droit à la portabilité ;'],
                    [
                        'droit de retirer votre consentement à tout moment, sans que cela remette en cause les traitements déjà effectués.',
                    ],
                ),
                paragraph(
                    'Pour exercer ces droits, écrivez à ',
                    contactLink,
                    ". Une réponse vous sera apportée dans un délai d'un mois au plus.",
                ),
                paragraph(
                    'Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la ',
                    {
                        text: "Commission nationale de l'informatique et des libertés (CNIL)",
                        href: 'https://www.cnil.fr/fr/plaintes',
                    },
                    " ou à l'autorité de protection des données de votre pays.",
                ),
            ],
        },
        {
            id: 'modifications',
            title: 'Modifications',
            blocks: [
                paragraph(
                    'Cette politique peut évoluer, par exemple si un nouveau service est ajouté au site. La date de dernière mise à jour figure en haut de cette page.',
                ),
            ],
        },
    ] satisfies PolicySection[],
};
