<?php

namespace App;

/**
 * Delivery state of one newsletter email (ADM-SUB-27).
 */
enum NewsletterRecipientStatus: string
{
    case Pending = 'pending';
    case Sent = 'sent';
    case Failed = 'failed';
}
