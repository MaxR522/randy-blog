<?php

namespace App;

/**
 * Lifecycle of a newsletter (ADM-SUB-10). Only drafts can be edited. « Envoyer » moves a draft to
 * `Sending`; once no recipient is pending, it ends `Sent`, or `PartiallyFailed` when some emails failed (ADM-SUB-27).
 */
enum NewsletterStatus: string
{
    case Draft = 'draft';
    case Sending = 'sending';
    case Sent = 'sent';
    case PartiallyFailed = 'partially_failed';
}
