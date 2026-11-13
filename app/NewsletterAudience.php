<?php

namespace App;

/**
 * Who receives a newsletter (ADM-SUB-25): every confirmed subscriber, or a selection of them.
 */
enum NewsletterAudience: string
{
    case All = 'all';
    case Selection = 'selection';
}
