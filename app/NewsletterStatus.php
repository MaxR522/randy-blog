<?php

namespace App;

/**
 * Lifecycle of a newsletter (ADM-SUB-10). Only drafts can be edited; the sending states come with session 12.
 */
enum NewsletterStatus: string
{
    case Draft = 'draft';
    case Sending = 'sending';
    case Sent = 'sent';
    case PartiallyFailed = 'partially_failed';
}
