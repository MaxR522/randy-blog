<?php

/*
 * Site identity used outside React: head tags, structured data, feeds and llms.txt.
 * The social URLs mirror `resources/js/lib/social.ts`: change both together.
 */
return [

    'name' => 'Randy Donny',

    'tagline' => 'Je pense, donc j’essuie…',

    /*
     * Meta description of the home page (SEO-HEAD-3): a real sentence of 140 to 160 characters.
     */
    'description' => 'Le blog personnel de Randy Donny : chroniques, analyses et billets d’humeur sur la politique, la culture et la société. Je pense, donc j’essuie…',

    /*
     * Whether search engines may index the site: robots.txt rules and the `X-Robots-Tag` header (SEO-CRAWL-2).
     * Unset, only production is indexable. Set SEO_INDEXABLE=true to run a Lighthouse SEO audit on a local copy,
     * never on a public staging copy.
     */
    'indexable' => env('SEO_INDEXABLE'),

    'language' => 'fr-FR',

    'og_locale' => 'fr_FR',

    'x_handle' => '@Randydonny',

    'social' => [
        'hautetfort' => 'http://randydoit.hautetfort.com/',
        'facebook' => 'https://www.facebook.com/randy.donny',
        'x' => 'https://x.com/Randydonny',
        'linkedin' => 'https://mg.linkedin.com/in/randy-donny-9158aa91',
        'youtube' => 'https://www.youtube.com/channel/UCRZInX-WMUTXHA1N4dz6Uiw',
    ],

];
