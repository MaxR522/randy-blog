<?php

namespace App\Support\Analytics;

use RuntimeException;

/**
 * GA4 is not configured, unreachable or refused a request: the dashboard falls back to the database figures (ADM-ANA-5).
 */
class Ga4Exception extends RuntimeException {}
