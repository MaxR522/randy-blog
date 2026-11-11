<?php

namespace App\Notifications;

/**
 * A security alert (ADM-SEC-7): `User::routeNotificationForMail()` sends it to the login email and to the verified
 * recovery email.
 */
interface SecurityAlert {}
