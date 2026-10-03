<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
@foreach ($pages as $page)
    <url>
        <loc>{{ $page['loc'] }}</loc>
@if ($page['lastmod'])
        <lastmod>{{ $page['lastmod'] }}</lastmod>
@endif
@if ($page['image'])
        <image:image>
            <image:loc>{{ $page['image'] }}</image:loc>
        </image:image>
@endif
    </url>
@endforeach
</urlset>
