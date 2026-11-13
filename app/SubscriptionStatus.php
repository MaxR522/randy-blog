<?php

namespace App;

/**
 * Derived from the V1 columns: `unsubscribed_at` wins, then `is_verified` (ADM-SUB-2).
 */
enum SubscriptionStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Unsubscribed = 'unsubscribed';
}
