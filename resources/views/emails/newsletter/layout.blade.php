{{--
    The newsletter email (ADM-SUB-22), after the `Newsletter` and `Newsletter-360` boards: 600 px table layout,
    Inter with Arial as the fallback most clients use, inline styles. The <style> block only holds the phone rules.
    Same header as the other emails (`vendor/mail/html/header.blade.php`): « Blog de Randy Donny », no tagline (decided 2026-11-13).
--}}
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>{{ $subject }}</title>
<style>
@media only screen and (max-width: 600px) {
    .email-body { width: 100% !important; }
    .email-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .email-wordmark { font-size: 24px !important; }
    .email-content { font-size: 17px !important; }
    .email-card-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .email-card-title { font-size: 24px !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;-webkit-text-size-adjust:none;">
@if ($preheader !== '')
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4f4f4;opacity:0;">{{ $preheader }}{!! str_repeat('&#847;&zwnj;&nbsp;', 40) !!}</div>
@endif
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#f4f4f4;">
<tr><td align="center" style="padding:32px 0 40px;">
<table role="presentation" class="email-body" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background-color:#ffffff;border-collapse:collapse;">
<tr><td class="email-pad" style="border-top:4px solid #2b2b2b;border-bottom:1px solid #d4d4d4;padding:32px 40px 24px;text-align:center;">
<a href="{{ url('/') }}" class="email-wordmark" style="font-family:Inter, Arial, Helvetica, sans-serif;font-weight:600;font-size:32px;letter-spacing:-0.015em;color:#2b2b2b;text-decoration:none;">Blog de Randy Donny</a>
</td></tr>
<tr><td class="email-pad email-content content" style="padding:32px 40px 8px;font-family:Inter, Arial, Helvetica, sans-serif;font-size:18px;line-height:1.6;color:#2b2b2b;">
{!! $content !!}
</td></tr>
<tr><td class="email-pad" style="padding:32px 40px 36px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-top:1px solid #d4d4d4;"><tr><td style="padding-top:24px;font-family:Inter, Arial, Helvetica, sans-serif;font-size:14px;line-height:1.5;color:#636363;">
<p style="margin:0 0 16px;font-weight:600;color:#2b2b2b;"><a href="{{ $social['facebook'] }}" style="color:#2847a1;text-decoration:underline;">Facebook</a> &nbsp;·&nbsp; <a href="{{ $social['x'] }}" style="color:#2847a1;text-decoration:underline;">X</a> &nbsp;·&nbsp; <a href="{{ $social['linkedin'] }}" style="color:#2847a1;text-decoration:underline;">LinkedIn</a> &nbsp;·&nbsp; <a href="{{ $social['youtube'] }}" style="color:#2847a1;text-decoration:underline;">YouTube</a></p>
<p style="margin:0 0 12px;">Vous recevez cet email car vous êtes abonné à la newsletter de Randy Donny.</p>
<p style="margin:0;"><a href="{{ $unsubscribeUrl }}" style="color:#2b2b2b;text-decoration:underline;">Se désabonner</a></p>
</td></tr></table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
