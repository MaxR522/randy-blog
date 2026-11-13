{{-- Article card of the newsletter (ADM-SUB-21), after the `Newsletter` board. The image is decorative: the title says it all. --}}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:24px 0;border:1px solid #d4d4d4;border-collapse:separate;border-radius:2px;">
@if ($cover)
<tr><td style="padding:0;"><a href="{{ $url }}" tabindex="-1"><img src="{{ $cover }}" alt="" width="518" style="display:block;margin:0;width:100%;max-width:100%;height:auto;border:0;"></a></td></tr>
@endif
<tr><td class="email-card-pad" style="padding:24px 24px 28px;">
@if ($categories !== '')
<div style="font-family:Inter, Arial, Helvetica, sans-serif;font-weight:600;font-size:11.5px;letter-spacing:0.08em;text-transform:uppercase;color:#2847a1;padding-bottom:10px;">{{ $categories }}</div>
@endif
<h2 class="email-card-title" style="margin:0 0 12px;font-family:Inter, Arial, Helvetica, sans-serif;font-weight:600;font-size:28px;line-height:1.15;letter-spacing:-0.015em;color:#2b2b2b;"><a href="{{ $url }}" style="color:#2b2b2b;text-decoration:none;">{{ $title }}</a></h2>
@if ($chapo !== '')
<p style="margin:0 0 22px;font-family:Inter, Arial, Helvetica, sans-serif;font-size:17px;line-height:1.55;color:#636363;">{{ $chapo }}</p>
@endif
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#2b2b2b;border-radius:4px;"><a href="{{ $url }}" style="display:inline-block;padding:14px 24px;font-family:Inter, Arial, Helvetica, sans-serif;font-weight:600;font-size:15px;line-height:1;color:#ffffff;text-decoration:none;">Lire l’article</a></td></tr></table>
</td></tr>
</table>
