<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
    <channel>
        <title>{{ config('blog.name') }}</title>
        <link>{{ \App\Support\Seo\Seo::homeUrl() }}</link>
        <description>{{ config('blog.description') }}</description>
        <language>fr</language>
        <atom:link href="{{ route('feed') }}" rel="self" type="application/rss+xml" />
@if ($articles->isNotEmpty())
        <lastBuildDate>{{ $articles->max(fn ($article) => $article->updated_at ?? $article->published_date)?->toRfc2822String() }}</lastBuildDate>
@endif
@foreach ($articles as $article)
        <item>
            <title>{{ Str::squish($article->title) }}</title>
            <link>{{ route('articles.show', $article->slug) }}</link>
            <guid isPermaLink="true">{{ route('articles.show', $article->slug) }}</guid>
            <pubDate>{{ $article->published_date?->toRfc2822String() }}</pubDate>
@if ($article->author)
            <dc:creator>{{ $authorName }}</dc:creator>
@endif
@foreach ($article->categories as $category)
            <category>{{ $category->value }}</category>
@endforeach
            <description>{{ $article->metaDescription() }}</description>
            <content:encoded><![CDATA[{!! str_replace(']]>', ']]]]><![CDATA[>', $html($article->lead_paragraph).$html($article->content)) !!}]]></content:encoded>
@if ($image($article))
            <media:content url="{{ $image($article) }}" medium="image" />
@endif
        </item>
@endforeach
    </channel>
</rss>
