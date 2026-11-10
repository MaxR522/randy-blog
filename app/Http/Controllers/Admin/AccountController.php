<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AvatarRequest;
use App\Http\Requests\BiographyRequest;
use App\Http\Requests\DisplayNameRequest;
use App\Http\Requests\LoginEmailRequest;
use App\MediaFolder;
use App\Models\User;
use App\Notifications\ConfirmLoginEmailChange;
use App\Notifications\LoginEmailChanged;
use App\Support\ArticleHtml;
use App\Support\Cloudinary\Cloudinary;
use App\Support\Cloudinary\CloudinaryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * « Gestion du compte », Profile tab (spec §5.6.1): each field is saved on its own.
 */
class AccountController extends Controller
{
    public function profile(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('admin/account-profile', [
            'profile' => [
                'avatar' => $user->avatar,
                'avatarCredit' => $user->avatar_credit,
                'displayName' => $user->display_name,
                'bio' => ArticleHtml::clean($user->bio),
                'bioHtml' => ArticleHtml::sanitize($user->bio),
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * Save the cropped avatar and its credit (ADM-ACC-1). The previous image is deleted from Cloudinary only once the
     * user points to the new one, so a failed save never leaves a broken avatar.
     */
    public function updateAvatar(AvatarRequest $request, Cloudinary $cloudinary): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $previousAvatar = $user->avatar;

        if ($request->file('avatar') !== null) {
            $user->avatar = $this->uploadAvatar($request, $cloudinary);
        }

        $user->avatar_credit = $request->filled('avatar_credit') ? $request->string('avatar_credit')->trim()->toString() : null;
        $user->save();

        if ($previousAvatar !== null && $previousAvatar !== $user->avatar) {
            $cloudinary->delete($previousAvatar);
        }

        return Inertia::flash('success', 'Avatar enregistré.')->back();
    }

    public function updateDisplayName(DisplayNameRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->update(['display_name' => $request->string('display_name')->trim()->toString()]);

        return Inertia::flash('success', 'Nom d’affichage enregistré.')->back();
    }

    public function updateBiography(BiographyRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->update(['bio' => ArticleHtml::clean($request->input('bio')) ?: null]);

        return Inertia::flash('success', 'Biographie enregistrée.')->back();
    }

    /**
     * Send the confirmation link to the new login address (ADM-ACC-4). Nothing changes until it is opened.
     *
     * The link carries the new address and a hash of the current one, so no pending state is stored, and a link
     * stops working once the address has changed by another way.
     */
    public function requestEmailChange(LoginEmailRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $newEmail = $request->string('email')->toString();

        $confirmationUrl = URL::temporarySignedRoute(
            'admin.account.email.confirm',
            now()->addMinutes(ConfirmLoginEmailChange::ExpiresInMinutes),
            ['user' => $user->id, 'email' => $newEmail, 'hash' => $this->emailHash($user)],
        );

        Notification::route('mail', $newEmail)->notify(new ConfirmLoginEmailChange($confirmationUrl));

        return Inertia::flash('success', "Un lien de confirmation a été envoyé à {$newEmail}.")->back();
    }

    /**
     * Apply the new login address from the emailed link. It works without a session, since the link may be opened on
     * another device; any invalid link gets the 404, like the rest of the admin for guests.
     */
    public function confirmEmailChange(Request $request, User $user): RedirectResponse
    {
        $newEmail = $request->string('email')->toString();

        abort_unless($request->hasValidSignature(), 404);
        abort_unless(hash_equals($this->emailHash($user), $request->string('hash')->toString()), 404);
        abort_if($newEmail === '' || User::withTrashed()->where('email', $newEmail)->exists(), 404);

        $previousEmail = $user->email;

        // Reset links were sent to the old address: they must not outlive it.
        Password::broker()->deleteToken($user);

        $user->forceFill(['email' => $newEmail, 'email_verified_at' => now()])->save();

        Notification::route('mail', $previousEmail)->notify(new LoginEmailChanged($newEmail));

        $message = 'Votre adresse de connexion est désormais '.$newEmail.'.';

        if ($request->user()?->is($user)) {
            Inertia::flash('success', $message);

            return to_route('admin.account');
        }

        return to_route('login')->with('status', $message.' Connectez-vous avec cette adresse.');
    }

    private function emailHash(User $user): string
    {
        return sha1(mb_strtolower($user->email));
    }

    /**
     * @throws ValidationException when Cloudinary refuses the file
     */
    private function uploadAvatar(AvatarRequest $request, Cloudinary $cloudinary): string
    {
        try {
            return $cloudinary->upload($request->file('avatar'), MediaFolder::Avatars)->url;
        } catch (CloudinaryException $exception) {
            Log::error($exception->getMessage());

            throw ValidationException::withMessages(['avatar' => CloudinaryException::UserMessage]);
        }
    }
}
