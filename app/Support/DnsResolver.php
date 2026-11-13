<?php

namespace App\Support;

/**
 * DNS lookups behind a class, so tests can swap it and never touch the network.
 */
class DnsResolver
{
    /**
     * Whether the domain can receive mail: an MX record, or failing that an A or AAAA record (RFC 5321 §5.1).
     */
    public function acceptsMail(string $domain): bool
    {
        $domain = rtrim($domain, '.').'.';

        return checkdnsrr($domain, 'MX') || checkdnsrr($domain, 'A') || checkdnsrr($domain, 'AAAA');
    }
}
