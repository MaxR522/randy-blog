<?php

namespace App\Http\Responses;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Laravel\Fortify\Contracts\FailedPasswordResetLinkRequestResponse;

/**
 * Answers a failed reset request (unknown address, request too soon) exactly as a successful one,
 * so the form never reveals which address has an account.
 */
class UniformPasswordResetLinkResponse implements FailedPasswordResetLinkRequestResponse
{
    /**
     * @param  Request  $request
     */
    public function toResponse($request): RedirectResponse
    {
        return back()->with('status', trans(Password::RESET_LINK_SENT));
    }
}
