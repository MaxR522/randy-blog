<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    /*
     * IndexNow (SEO-MAP-4): any 8 to 128 letters, digits or dashes. Pings are sent from production only.
     */
    /*
     * Brevo, the email provider (spec §7.6). Mail itself goes through the `smtp` mailer; these only pace the newsletter
     * (ADM-SUB-27: the free plan sends 300 emails a day, transactional ones included) and guard the webhook that reports
     * hard bounces and spam complaints.
     */
    'brevo' => [
        'newsletter_per_minute' => (int) env('NEWSLETTER_PER_MINUTE', 60),
        'newsletter_per_day' => (int) env('NEWSLETTER_PER_DAY', 250),
        'webhook_token' => env('BREVO_WEBHOOK_TOKEN'),
    ],

    'indexnow' => [
        'key' => env('INDEXNOW_KEY'),
    ],

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'cloudinary' => [
        'url' => env('CLOUDINARY_URL'),
    ],

    /*
     * « Générer avec l’IA » in the article editor. A free-tier key from Google AI Studio is enough.
     */
    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-3.5-flash-lite'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
