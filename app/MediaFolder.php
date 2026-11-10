<?php

namespace App;

/**
 * Cloudinary folders, one per kind of upload (spec §7.5).
 */
enum MediaFolder: string
{
    case Articles = 'articles';
    case Avatars = 'avatars';
    case Newsletters = 'newsletters';
}
