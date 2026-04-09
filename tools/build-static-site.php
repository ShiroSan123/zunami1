<?php
declare(strict_types=1);

const ZUNAMI_SITE_URL = 'https://zunami1.kars-it.ru';

$projectRoot = dirname(__DIR__);
$extractedRoot = $projectRoot . DIRECTORY_SEPARATOR . '_wpress_extracted';
$sqlPath = $extractedRoot . DIRECTORY_SEPARATOR . 'database.sql';

if (!is_file($sqlPath)) {
    fwrite(STDERR, "database.sql not found in _wpress_extracted\n");
    exit(1);
}

$data = parseDatabase($sqlPath);
[$pages, $posts, $attachments, $postMeta, $options] = [
    $data['pages'],
    $data['posts'],
    $data['attachments'],
    $data['postMeta'],
    $data['options'],
];

$frontPageId = (int) ($options['page_on_front'] ?? 0);
$postsPageId = (int) ($options['page_for_posts'] ?? 0);
$posts = decoratePosts($posts, $attachments, $postMeta);

$customLogoPath = getCustomLogoPath($options, $attachments);
$pageRoutes = buildPageRoutes($pages, $frontPageId, $postsPageId);
$GLOBALS['zunami_route_aliases'] = buildRouteAliases($pages, $pageRoutes);
$sortedPosts = sortPostsByDateDesc($posts);
$latestPosts = array_slice($sortedPosts, 0, 3);
$searchIndex = buildSearchIndex($pages, $posts, $pageRoutes);

copyThemeAssets($extractedRoot, $projectRoot);

writeJson(
    $projectRoot . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'search-index.json',
    $searchIndex
);

if (is_file($extractedRoot . DIRECTORY_SEPARATOR . 'litespeed' . DIRECTORY_SEPARATOR . 'robots.txt')) {
    safeWrite(
        $projectRoot . DIRECTORY_SEPARATOR . 'robots.txt',
        (string) file_get_contents($extractedRoot . DIRECTORY_SEPARATOR . 'litespeed' . DIRECTORY_SEPARATOR . 'robots.txt')
    );
}

$mainMenu = [
    ['label' => 'О компании', 'route' => $pageRoutes[75] ?? 'company'],
    ['label' => 'Услуги', 'route' => $pageRoutes[77] ?? 'uslugi'],
    ['label' => 'Блог', 'route' => $pageRoutes[$postsPageId] ?? 'blog'],
    ['label' => 'Контакты', 'route' => $pageRoutes[83] ?? 'contacts'],
];

$formDefinitions = buildFormDefinitions();

renderHomePage(
    $projectRoot,
    $pages[$frontPageId],
    $pageRoutes[$frontPageId] ?? '',
    $latestPosts,
    $sortedPosts,
    $pageRoutes,
    $mainMenu,
    $customLogoPath,
    $formDefinitions
);

renderBlogPage(
    $projectRoot,
    $pages[$postsPageId],
    $pageRoutes[$postsPageId] ?? 'blog',
    $sortedPosts,
    $mainMenu,
    $customLogoPath,
    $formDefinitions
);

foreach ($pages as $pageId => $page) {
    if ($pageId === $frontPageId || $pageId === $postsPageId) {
        continue;
    }

    $route = $pageRoutes[$pageId] ?? trim((string) $page['post_name'], '/');
    renderPage(
        $projectRoot,
        $page,
        $route,
        $latestPosts,
        $sortedPosts,
        $pageRoutes,
        $mainMenu,
        $customLogoPath,
        $formDefinitions
    );
}

foreach ($posts as $post) {
    renderPost(
        $projectRoot,
        $post,
        trim((string) $post['post_name'], '/'),
        $latestPosts,
        $sortedPosts,
        $pageRoutes,
        $attachments,
        $postMeta,
        $mainMenu,
        $customLogoPath,
        $formDefinitions
    );
}

render404Page($projectRoot, $mainMenu, $customLogoPath, $formDefinitions);

echo "Static site generated successfully.\n";

function parseDatabase(string $sqlPath): array
{
    $fh = fopen($sqlPath, 'rb');
    if ($fh === false) {
        throw new RuntimeException('Failed to open database.sql');
    }

    $pages = [];
    $posts = [];
    $attachments = [];
    $postMeta = [];
    $options = [];

    while (($line = fgets($fh)) !== false) {
        if (str_starts_with($line, 'INSERT INTO `SERVMASK_PREFIX_options` VALUES ')) {
            $fields = parseInsertValues($line, 'INSERT INTO `SERVMASK_PREFIX_options` VALUES ');
            if (count($fields) >= 4) {
                $options[$fields[1]] = decodeSqlValue($fields[2]);
            }
            continue;
        }

        if (str_starts_with($line, 'INSERT INTO `SERVMASK_PREFIX_postmeta` VALUES ')) {
            $fields = parseInsertValues($line, 'INSERT INTO `SERVMASK_PREFIX_postmeta` VALUES ');
            if (count($fields) >= 4) {
                $postId = (int) $fields[1];
                $metaKey = (string) $fields[2];
                $postMeta[$postId][$metaKey][] = decodeSqlValue($fields[3]);
            }
            continue;
        }

        if (!str_starts_with($line, 'INSERT INTO `SERVMASK_PREFIX_posts` VALUES ')) {
            continue;
        }

        $fields = parseInsertValues($line, 'INSERT INTO `SERVMASK_PREFIX_posts` VALUES ');
        if (count($fields) < 23) {
            continue;
        }

        $record = [
            'ID' => (int) $fields[0],
            'post_author' => (int) $fields[1],
            'post_date' => decodeSqlValue($fields[2]),
            'post_content' => decodeSqlValue($fields[4]),
            'post_title' => decodeSqlValue($fields[5]),
            'post_status' => decodeSqlValue($fields[7]),
            'post_name' => decodeSqlValue($fields[11]),
            'post_modified' => decodeSqlValue($fields[14]),
            'post_parent' => (int) $fields[17],
            'guid' => decodeSqlValue($fields[18]),
            'menu_order' => (int) $fields[19],
            'post_type' => decodeSqlValue($fields[20]),
            'post_mime_type' => decodeSqlValue($fields[21]),
        ];

        if ($record['post_status'] !== 'publish' && $record['post_type'] !== 'attachment') {
            continue;
        }

        if ($record['post_type'] === 'page') {
            $pages[$record['ID']] = $record;
            continue;
        }

        if ($record['post_type'] === 'post') {
            $posts[$record['ID']] = $record;
            continue;
        }

        if ($record['post_type'] === 'attachment') {
            $attachments[$record['ID']] = $record;
        }
    }

    fclose($fh);

    foreach ($attachments as $attachmentId => &$attachment) {
        $attachedFile = $postMeta[$attachmentId]['_wp_attached_file'][0] ?? '';
        $guid = $attachment['guid'] ?? '';
        $attachment['path'] = ltrim((string) $attachedFile, '/');
        $attachment['url_path'] = $attachment['path'] !== ''
            ? 'wp-content/uploads/' . ltrim((string) $attachment['path'], '/')
            : ltrim(str_replace([ZUNAMI_SITE_URL, '/'], ['', ''], (string) $guid), '/');
    }
    unset($attachment);

    return [
        'pages' => $pages,
        'posts' => $posts,
        'attachments' => $attachments,
        'postMeta' => $postMeta,
        'options' => $options,
    ];
}

function parseInsertValues(string $line, string $prefix): array
{
    $values = substr($line, strlen($prefix));
    $values = trim($values);
    $values = preg_replace('/;\s*$/', '', $values);
    $values = trim((string) $values, "()\r\n");

    return str_getcsv($values, ',', "'", '\\');
}

function decodeSqlValue(?string $value): string
{
    if ($value === null) {
        return '';
    }

    return stripcslashes($value);
}

function getCustomLogoPath(array $options, array $attachments): string
{
    $modsRaw = $options['theme_mods_zunami'] ?? '';
    if ($modsRaw === '') {
        return 'wp-content/uploads/2025/12/zunami-logo.svg';
    }

    $mods = @unserialize($modsRaw, ['allowed_classes' => false]);
    if (!is_array($mods)) {
        return 'wp-content/uploads/2025/12/zunami-logo.svg';
    }

    $logoId = (int) ($mods['custom_logo'] ?? 0);
    if ($logoId <= 0 || !isset($attachments[$logoId])) {
        return 'wp-content/uploads/2025/12/zunami-logo.svg';
    }

    return ltrim((string) $attachments[$logoId]['url_path'], '/');
}

function buildPageRoutes(array $pages, int $frontPageId, int $postsPageId): array
{
    $routes = [];

    $resolver = function (int $pageId) use (&$resolver, &$routes, $pages, $frontPageId, $postsPageId): string {
        if (isset($routes[$pageId])) {
            return $routes[$pageId];
        }

        if ($pageId === $frontPageId) {
            return $routes[$pageId] = '';
        }

        if ($pageId === $postsPageId) {
            return $routes[$pageId] = 'blog';
        }

        $page = $pages[$pageId] ?? null;
        if ($page === null) {
            return $routes[$pageId] = '';
        }

        $slug = trim((string) $page['post_name'], '/');
        if ($page['post_parent'] > 0 && isset($pages[$page['post_parent']])) {
            $parentRoute = $resolver((int) $page['post_parent']);
            return $routes[$pageId] = trim($parentRoute . '/' . $slug, '/');
        }

        return $routes[$pageId] = $slug;
    };

    foreach (array_keys($pages) as $pageId) {
        $resolver((int) $pageId);
    }

    return $routes;
}

function buildRouteAliases(array $pages, array $pageRoutes): array
{
    $aliases = [];

    foreach ($pages as $pageId => $page) {
        $slug = trim((string) ($page['post_name'] ?? ''), '/');
        $route = trim((string) ($pageRoutes[$pageId] ?? ''), '/');

        if ($slug === '' || $route === '' || $slug === $route || isset($aliases[$slug])) {
            continue;
        }

        $aliases[$slug] = $route;
    }

    return $aliases;
}

function getRouteAliases(): array
{
    $aliases = $GLOBALS['zunami_route_aliases'] ?? [];
    return is_array($aliases) ? $aliases : [];
}

function sortPostsByDateDesc(array $posts): array
{
    $sorted = array_values($posts);
    usort(
        $sorted,
        static fn(array $a, array $b): int => strcmp((string) $b['post_date'], (string) $a['post_date'])
    );

    return $sorted;
}

function buildSearchIndex(array $pages, array $posts, array $pageRoutes): array
{
    $index = [];

    foreach ($pages as $pageId => $page) {
        $route = $pageRoutes[$pageId] ?? trim((string) $page['post_name'], '/');
        if ($route === 'not-found') {
            continue;
        }

        $index[] = [
            'title' => (string) $page['post_title'],
            'route' => $route,
            'type' => 'page',
            'excerpt' => makeExcerpt((string) $page['post_content'], 140),
        ];
    }

    foreach ($posts as $post) {
        $index[] = [
            'title' => (string) $post['post_title'],
            'route' => trim((string) $post['post_name'], '/'),
            'type' => 'post',
            'excerpt' => makeExcerpt((string) $post['post_content'], 140),
        ];
    }

    usort(
        $index,
        static fn(array $a, array $b): int => strcmp($a['title'], $b['title'])
    );

    return $index;
}

function buildFormDefinitions(): array
{
    return [
        'Обратная связь' => [
            'submitLabel' => 'Отправить',
            'buttonClass' => 'zunami-button',
            'fields' => [
                ['type' => 'text', 'name' => 'your-name', 'placeholder' => 'Имя', 'required' => true],
                ['type' => 'tel', 'name' => 'your-tel', 'placeholder' => '+7 (000) 000-00-00', 'required' => true],
                ['type' => 'email', 'name' => 'your-email', 'placeholder' => 'email', 'required' => true],
                ['type' => 'text', 'name' => 'your-business', 'placeholder' => 'Вид бизнеса', 'required' => false],
                ['type' => 'textarea', 'name' => 'your-message', 'placeholder' => 'Ваш вопрос', 'required' => true],
            ],
        ],
        'Заявка (контакты)' => [
            'submitLabel' => 'Отправить',
            'buttonClass' => 'zunami-button zunami-button_simple',
            'fields' => [
                ['type' => 'text', 'name' => 'your-name', 'placeholder' => 'Имя', 'required' => true],
                ['type' => 'tel', 'name' => 'your-tel', 'placeholder' => '+7 (000) 000-00-00', 'required' => true],
                ['type' => 'email', 'name' => 'your-email', 'placeholder' => 'e-mail', 'required' => true],
                ['type' => 'text', 'name' => 'your-company', 'placeholder' => 'Ваша компания', 'required' => false],
            ],
        ],
        'modal' => [
            'submitLabel' => 'Отправить',
            'buttonClass' => 'zunami-button zunami-button_simple',
            'fields' => [
                ['type' => 'text', 'name' => 'your-name', 'placeholder' => 'Имя', 'required' => true],
                ['type' => 'tel', 'name' => 'your-tel', 'placeholder' => '+7 (000) 000-00-00', 'required' => true],
                ['type' => 'email', 'name' => 'your-email', 'placeholder' => 'e-mail', 'required' => true],
                ['type' => 'text', 'name' => 'your-company', 'placeholder' => 'Ваша компания', 'required' => false],
            ],
        ],
    ];
}

function decoratePosts(array $posts, array $attachments, array $postMeta): array
{
    foreach ($posts as $postId => $post) {
        $thumbnailId = (int) ($postMeta[$postId]['_thumbnail_id'][0] ?? 0);
        if ($thumbnailId > 0 && isset($attachments[$thumbnailId]['url_path'])) {
            $posts[$postId]['thumbnail_path'] = ltrim((string) $attachments[$thumbnailId]['url_path'], '/');
            continue;
        }

        $posts[$postId]['thumbnail_path'] = 'assets/icons/favicon.svg';
    }

    return $posts;
}

function copyThemeAssets(string $extractedRoot, string $projectRoot): void
{
    copyRecursive(
        $extractedRoot . DIRECTORY_SEPARATOR . 'uploads',
        $projectRoot . DIRECTORY_SEPARATOR . 'wp-content' . DIRECTORY_SEPARATOR . 'uploads'
    );
    copyRecursive(
        $extractedRoot . DIRECTORY_SEPARATOR . 'themes' . DIRECTORY_SEPARATOR . 'zunami' . DIRECTORY_SEPARATOR . 'icons',
        $projectRoot . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'icons'
    );
    copyRecursive(
        $extractedRoot . DIRECTORY_SEPARATOR . 'themes' . DIRECTORY_SEPARATOR . 'zunami' . DIRECTORY_SEPARATOR . 'fonts',
        $projectRoot . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'fonts'
    );
}

function copyRecursive(string $source, string $target): void
{
    if (!is_dir($source)) {
        return;
    }

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($source, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $item) {
        $relativePath = substr($item->getPathname(), strlen($source) + 1);
        $targetPath = $target . DIRECTORY_SEPARATOR . $relativePath;

        if ($item->isDir()) {
            if (!is_dir($targetPath)) {
                mkdir($targetPath, 0777, true);
            }
            continue;
        }

        safeWrite($targetPath, (string) file_get_contents($item->getPathname()));
    }
}

function renderHomePage(
    string $projectRoot,
    array $page,
    string $route,
    array $latestPosts,
    array $sortedPosts,
    array $pageRoutes,
    array $mainMenu,
    string $customLogoPath,
    array $formDefinitions
): void {
    $content = transformContent((string) $page['post_content'], $route, $latestPosts, $sortedPosts, $pageRoutes, $formDefinitions);
    $html = renderDocument(
        [
            'route' => $route,
            'title' => 'Zunami — страховой брокер',
            'description' => makeExcerpt((string) $page['post_content'], 160),
            'bodyClass' => 'home',
            'mainClass' => 'site-main site-main--home',
            'mainContent' => "<article class=\"entry entry--home\"><div class=\"entry-content\">{$content}</div></article>",
            'mainMenu' => $mainMenu,
            'activeMenu' => 'home',
            'customLogoPath' => $customLogoPath,
            'formDefinitions' => $formDefinitions,
        ]
    );

    safeWrite(routeToFilePath($projectRoot, $route), $html);
}

function renderBlogPage(
    string $projectRoot,
    array $page,
    string $route,
    array $sortedPosts,
    array $mainMenu,
    string $customLogoPath,
    array $formDefinitions
): void {
    $cards = [];
    foreach ($sortedPosts as $index => $post) {
        $cards[] = renderArticleCard($post, $route, $index >= 9);
    }

    $button = count($sortedPosts) > 9
        ? '<div class="load-more-holder"><button class="zunami-button" id="load_more_posts" type="button">Ещё новости <span class="button-arrow"></span></button></div>'
        : '';

    $header = renderEntryHeader($route, (string) $page['post_title']);
    $content = $header
        . '<div class="zunami-post-grid">'
        . implode("\n", $cards)
        . '</div>'
        . $button;

    $html = renderDocument(
        [
            'route' => $route,
            'title' => 'Блог | Zunami',
            'description' => 'Новости и материалы страхового брокера Zunami.',
            'bodyClass' => 'page page--blog blog',
            'mainClass' => 'site-main site-main--blog',
            'mainContent' => "<article class=\"entry entry--blog\">{$content}</article>",
            'mainMenu' => $mainMenu,
            'activeMenu' => 'blog',
            'customLogoPath' => $customLogoPath,
            'formDefinitions' => $formDefinitions,
        ]
    );

    safeWrite(routeToFilePath($projectRoot, $route), $html);
}

function renderPage(
    string $projectRoot,
    array $page,
    string $route,
    array $latestPosts,
    array $sortedPosts,
    array $pageRoutes,
    array $mainMenu,
    string $customLogoPath,
    array $formDefinitions
): void {
    $template = 'default';
    $content = transformContent((string) $page['post_content'], $route, $latestPosts, $sortedPosts, $pageRoutes, $formDefinitions);
    $header = '';

    if (needsPageHeader((int) $page['ID'])) {
        $template = 'page-bc';
        $header = renderEntryHeader($route, (string) $page['post_title']);
    }

    $entryContent = trim($header . '<div class="entry-content">' . $content . '</div>');
    if ($entryContent === '<div class="entry-content"></div>') {
        $entryContent = $header . '<div class="entry-content"></div>';
    }

    $activeMenu = resolveActiveMenuForRoute($route);
    $title = $route === 'successfully' ? 'Спасибо | Zunami' : (string) $page['post_title'] . ' | Zunami';

    $html = renderDocument(
        [
            'route' => $route,
            'title' => $title,
            'description' => makeExcerpt((string) $page['post_content'], 160),
            'bodyClass' => 'page page--' . slugifyRoute($route),
            'mainClass' => 'site-main site-main--page',
            'mainContent' => "<article class=\"entry entry--page entry--{$template}\">{$entryContent}</article>",
            'mainMenu' => $mainMenu,
            'activeMenu' => $activeMenu,
            'customLogoPath' => $customLogoPath,
            'formDefinitions' => $formDefinitions,
        ]
    );

    safeWrite(routeToFilePath($projectRoot, $route), $html);
}

function renderPost(
    string $projectRoot,
    array $post,
    string $route,
    array $latestPosts,
    array $sortedPosts,
    array $pageRoutes,
    array $attachments,
    array $postMeta,
    array $mainMenu,
    string $customLogoPath,
    array $formDefinitions
): void {
    $rootPrefix = rootPrefixForRoute($route);
    $thumbnailId = (int) ($postMeta[(int) $post['ID']]['_thumbnail_id'][0] ?? 0);
    $thumbnail = '';
    if ($thumbnailId > 0 && isset($attachments[$thumbnailId]['url_path'])) {
        $src = prefixRootPath($rootPrefix, (string) $attachments[$thumbnailId]['url_path']);
        $alt = h((string) $post['post_title']);
        $thumbnail = "<figure class=\"entry-thumb\"><img src=\"{$src}\" alt=\"{$alt}\" loading=\"eager\"></figure>";
    }

    $date = formatDate((string) $post['post_date']);
    $readingTime = trim((string) ($postMeta[(int) $post['ID']]['reading_time'][0] ?? ''));
    $readingLine = $readingTime !== ''
        ? '<span class="entry-meta__item">Время чтения: ' . h($readingTime) . '</span>'
        : '';

    $content = transformContent((string) $post['post_content'], $route, $latestPosts, $sortedPosts, $pageRoutes, $formDefinitions);
    $header = '<header class="post-header">'
        . '<div class="entry-breadcrumps"><a href="' . h(linkToRoute($route, '')) . '">главная</a> / <a href="' . h(linkToRoute($route, 'blog')) . '">блог</a> / <span class="bc_current">' . h((string) $post['post_title']) . '</span></div>'
        . '<h1 class="entry-title">' . h((string) $post['post_title']) . '</h1>'
        . '<div class="entry-meta"><span class="entry-meta__item">' . h($date) . '</span>' . $readingLine . '</div>'
        . '</header>';

    $mainContent = '<article class="entry entry--post">'
        . $header
        . $thumbnail
        . '<div class="entry-content">' . $content . '</div>'
        . '<div class="post-share"><a class="zunami-button zunami-button_simple" href="' . h(linkToRoute($route, 'blog')) . '">Ко всем статьям</a></div>'
        . '</article>';

    $html = renderDocument(
        [
            'route' => $route,
            'title' => (string) $post['post_title'] . ' | Zunami',
            'description' => makeExcerpt((string) $post['post_content'], 160),
            'bodyClass' => 'post post--' . slugifyRoute($route),
            'mainClass' => 'site-main site-main--post',
            'mainContent' => $mainContent,
            'mainMenu' => $mainMenu,
            'activeMenu' => 'blog',
            'customLogoPath' => $customLogoPath,
            'formDefinitions' => $formDefinitions,
        ]
    );

    safeWrite(routeToFilePath($projectRoot, $route), $html);
}

function render404Page(string $projectRoot, array $mainMenu, string $customLogoPath, array $formDefinitions): void
{
    $mainContent = '<article class="entry entry--404">'
        . '<header class="entry-header entry-header--404"><h1 class="entry-title">404</h1><p class="entry-lead">Страница не найдена</p></header>'
        . '<div class="entry-content entry-content--center"><p>Проверьте адрес страницы или вернитесь на главную.</p><p><a class="zunami-button" href="./">На главную <span class="button-arrow"></span></a></p></div>'
        . '</article>';

    $html = renderDocument(
        [
            'route' => '404.html',
            'title' => '404 | Zunami',
            'description' => 'Страница не найдена.',
            'bodyClass' => 'error404',
            'mainClass' => 'site-main site-main--404',
            'mainContent' => $mainContent,
            'mainMenu' => $mainMenu,
            'activeMenu' => '',
            'customLogoPath' => $customLogoPath,
            'formDefinitions' => $formDefinitions,
        ]
    );

    safeWrite($projectRoot . DIRECTORY_SEPARATOR . '404.html', $html);
}

function renderDocument(array $view): string
{
    $route = (string) $view['route'];
    $rootPrefix = rootPrefixForRoute($route);
    $title = h((string) $view['title']);
    $description = h((string) $view['description']);
    $bodyClass = h((string) $view['bodyClass']);
    $mainClass = h((string) $view['mainClass']);
    $logoPath = prefixRootPath($rootPrefix, (string) $view['customLogoPath']);
    $menu = renderHeader($route, (array) $view['mainMenu'], (string) $view['activeMenu'], $logoPath);
    $footer = renderFooter($route, $logoPath, (array) $view['mainMenu']);
    $searchPopup = renderSearchPopup();
    $modal = renderModalWindow($route, (array) $view['formDefinitions']);
    $stylesheetHref = prefixRootPath($rootPrefix, 'assets/css/styles.css');
    $scriptHref = prefixRootPath($rootPrefix, 'assets/js/main.js');
    $faviconSvg = prefixRootPath($rootPrefix, 'assets/icons/favicon.svg');
    $faviconPng = prefixRootPath($rootPrefix, 'assets/icons/favicon.png');
    $faviconDark = prefixRootPath($rootPrefix, 'assets/icons/favicon_black.png');

    return <<<HTML
<!doctype html>
<html lang="ru" data-root-prefix="{$rootPrefix}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{$title}</title>
  <meta name="description" content="{$description}">
  <link rel="icon" type="image/png" sizes="32x32" href="{$faviconPng}" media="(prefers-color-scheme: light)">
  <link rel="icon" type="image/png" sizes="32x32" href="{$faviconDark}" media="(prefers-color-scheme: dark)">
  <link rel="icon" type="image/svg+xml" href="{$faviconSvg}">
  <link rel="apple-touch-icon" href="{$faviconPng}">
  <link rel="stylesheet" href="{$stylesheetHref}">
</head>
<body class="{$bodyClass}">
  <div class="site-shell">
    {$searchPopup}
    {$menu}
    <main id="primary" class="{$mainClass}">
      {$view['mainContent']}
    </main>
    {$footer}
  </div>
  {$modal}
  <script src="{$scriptHref}" defer></script>
</body>
</html>
HTML;
}

function renderSearchPopup(): string
{
    return <<<HTML
<div class="search-popup" id="search_popup" hidden>
  <div class="search-popup__panel">
    <form class="search-popup__form" id="search_form">
      <label class="search-field">
        <span class="search-field__icon" aria-hidden="true"></span>
        <input type="search" id="search_input" class="search-field__input" placeholder="Поиск по сайту" autocomplete="off">
      </label>
      <button type="button" class="search-popup__close" id="search_popup_close" aria-label="Закрыть поиск"></button>
    </form>
    <div class="search-popup-results" id="search_popup_results">
      <div class="search-popup-results__inner" id="search_popup_results_text"></div>
    </div>
  </div>
</div>
HTML;
}

function renderHeader(string $currentRoute, array $mainMenu, string $activeMenu, string $logoPath): string
{
    $desktopItems = [];
    foreach ($mainMenu as $item) {
        $route = (string) $item['route'];
        $isActive = isMenuItemActive($currentRoute, $route, $activeMenu);
        $className = $isActive ? 'menu__item is-current' : 'menu__item';
        $href = h(linkToRoute($currentRoute, $route));
        $label = h((string) $item['label']);
        $desktopItems[] = "<li class=\"{$className}\"><a href=\"{$href}\">{$label}</a></li>";
    }

    $menuMarkup = implode("\n", $desktopItems);
    $homeHref = h(linkToRoute($currentRoute, ''));

    return <<<HTML
<header id="masthead" class="site-header-holder">
  <div class="site-header">
    <a class="site-logo" href="{$homeHref}" aria-label="На главную">
      <img src="{$logoPath}" alt="Логотип Zunami">
    </a>
    <nav class="main-navigation" aria-label="Основная навигация">
      <ul class="menu">
        {$menuMarkup}
      </ul>
    </nav>
    <div class="top-icons">
      <button class="top-icon search-button" id="search_popup_open" type="button" aria-label="Поиск"></button>
      <button class="top-icon mobile-menu-button" id="mobile_menu_open" type="button" aria-label="Меню"></button>
      <button class="zunami-button" id="open_main_popup" type="button">Отправить заявку <span class="button-arrow"></span></button>
    </div>
  </div>
  <div class="mobile-menu-holder" id="mobile_menu" hidden>
    <nav class="mobile-navigation" aria-label="Мобильная навигация">
      <ul class="menu">
        {$menuMarkup}
      </ul>
    </nav>
  </div>
</header>
HTML;
}

function renderFooter(string $currentRoute, string $logoPath, array $mainMenu): string
{
    $legalLinks = [
        ['label' => 'Политика', 'route' => 'politica'],
        ['label' => 'Согласие на ПД', 'route' => 'approval'],
        ['label' => 'Рассылка', 'route' => 'addapproval'],
    ];

    $menuItems = [];
    foreach ($mainMenu as $item) {
        $href = h(linkToRoute($currentRoute, (string) $item['route']));
        $label = h((string) $item['label']);
        $menuItems[] = "<li><a href=\"{$href}\">{$label}</a></li>";
    }

    $legalItems = [];
    foreach ($legalLinks as $item) {
        $href = h(linkToRoute($currentRoute, (string) $item['route']));
        $label = h((string) $item['label']);
        $legalItems[] = "<li><a href=\"{$href}\">{$label}</a></li>";
    }

    $year = date('Y');
    $menuMarkup = implode("\n", $menuItems);
    $legalMarkup = implode("\n", $legalItems);
    $homeHref = h(linkToRoute($currentRoute, ''));

    return <<<HTML
<footer id="colophon" class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <a class="site-logo site-logo--footer" href="{$homeHref}" aria-label="На главную">
        <img src="{$logoPath}" alt="Логотип Zunami">
      </a>
      <p class="footer-text">Страховой брокер для логистики и маркетплейсов.</p>
    </div>
    <div class="footer-nav">
      <ul class="footer-links">
        {$menuMarkup}
      </ul>
      <ul class="footer-links footer-links--muted">
        {$legalMarkup}
      </ul>
    </div>
    <div class="footer-meta">
      <p class="footer-text"><a href="tel:+74012391938">+7 (4012) 39-19-38</a></p>
      <p class="footer-text"><a href="mailto:info@zunami.pro">info@zunami.pro</a></p>
      <p class="footer-copy">© {$year} Zunami</p>
    </div>
  </div>
</footer>
HTML;
}

function renderModalWindow(string $route, array $formDefinitions): string
{
    $form = renderStaticForm($route, $formDefinitions['modal'], 'modal');

    return <<<HTML
<div class="modal-window" id="modal_request" hidden>
  <div class="modal-background" data-modal-close></div>
  <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal_request_title">
    <div class="modal-content">
      <div class="modal-body">
        <h4 id="modal_request_title">Создание заявки</h4>
        {$form}
      </div>
    </div>
  </div>
</div>
HTML;
}

function renderStaticForm(string $route, array $definition, string $variant): string
{
    $fieldsHtml = [];
    foreach ($definition['fields'] as $field) {
        $required = !empty($field['required']) ? ' required' : '';
        $requiredClass = !empty($field['required']) ? ' is-required' : '';
        $placeholder = h((string) $field['placeholder']);
        $name = h((string) $field['name']);

        if ($field['type'] === 'textarea') {
            $fieldsHtml[] = <<<HTML
<div class="form-field{$requiredClass}">
  <textarea name="{$name}" rows="4" placeholder="{$placeholder}"{$required}></textarea>
</div>
HTML;
            continue;
        }

        $type = h((string) $field['type']);
        $inputMode = $type === 'tel' ? ' inputmode="tel"' : '';
        $fieldsHtml[] = <<<HTML
<div class="form-field{$requiredClass}">
  <input type="{$type}" name="{$name}" placeholder="{$placeholder}"{$inputMode}{$required}>
</div>
HTML;
    }

    $approvalHref = h(linkToRoute($route, 'approval'));
    $politicaHref = h(linkToRoute($route, 'politica'));
    $newsletterHref = h(linkToRoute($route, 'addapproval'));
    $successHref = h(linkToRoute($route, 'successfully'));
    $buttonClass = h((string) $definition['buttonClass']);
    $submitLabel = h((string) $definition['submitLabel']);
    $fieldsMarkup = implode("\n", $fieldsHtml);

    return <<<HTML
<form class="static-form static-form--{$variant} js-static-form" data-success-url="{$successHref}" novalidate>
  {$fieldsMarkup}
  <label class="form-field form-field--checkbox">
    <input type="checkbox" name="acceptance-pd" required>
    <span>Я даю <a href="{$approvalHref}">согласие</a> на обработку персональных данных в соответствии с <a href="{$politicaHref}">Политикой обработки и обеспечения безопасности персональных данных</a></span>
  </label>
  <label class="form-field form-field--checkbox">
    <input type="checkbox" name="acceptance-ad" required>
    <span>Я даю <a href="{$newsletterHref}">согласие</a> на получение рекламной и информационной рассылки</span>
  </label>
  <button class="{$buttonClass}" type="submit">{$submitLabel}<span class="button-arrow"></span></button>
</form>
HTML;
}

function transformContent(
    string $rawContent,
    string $currentRoute,
    array $latestPosts,
    array $sortedPosts,
    array $pageRoutes,
    array $formDefinitions
): string {
    $content = decodeSqlValue($rawContent);
    $content = replaceShortcodes($content, $currentRoute, $latestPosts, $sortedPosts, $pageRoutes, $formDefinitions);
    $content = preg_replace('/<!--.*?-->/s', '', $content);
    $content = rewriteContentUrls((string) $content, $currentRoute);
    $content = preg_replace('/<p>\s*<\/p>/', '', (string) $content);
    $content = preg_replace('/\n{3,}/', "\n\n", (string) $content);

    return trim((string) $content);
}

function replaceShortcodes(
    string $content,
    string $currentRoute,
    array $latestPosts,
    array $sortedPosts,
    array $pageRoutes,
    array $formDefinitions
): string {
    $replacements = [
        '/\[typing\s+([^\]]+)\]/' => static function (array $matches): string {
            $atts = parseShortcodeAttributes($matches[1]);
            $tag = h($atts['tag'] ?? 'span');
            $class = h(trim(($atts['class'] ?? '') . ' typing-animation'));
            $text = h($atts['text'] ?? '');
            $chars = max(1, u_strlen($atts['text'] ?? ''));
            return "<{$tag} class=\"{$class}\" style=\"--chars:{$chars}\"><span class=\"typing-text\">{$text}</span><span class=\"typing-caret\" aria-hidden=\"true\"></span></{$tag}>";
        },
        '/\[rotating-star\s+([^\]]+)\]/' => static function (array $matches) use ($currentRoute): string {
            $atts = parseShortcodeAttributes($matches[1]);
            $icon = h(prefixRootPath(rootPrefixForRoute($currentRoute), 'assets/icons/icon-star.svg'));
            $caption = h($atts['caption'] ?? '');
            $class = h($atts['class'] ?? '');
            return "<div class=\"zunami-rotating-star\"><img src=\"{$icon}\" alt=\"\"><span class=\"zunami-rotating-star__caption {$class}\">{$caption}</span></div>";
        },
        '/\[zunami_iconbox\s+([^\]]+)\]/' => static function (array $matches) use ($currentRoute): string {
            $atts = parseShortcodeAttributes($matches[1]);
            $href = h(rewriteInternalPathForRoute($atts['href'] ?? '#main_popup', $currentRoute));
            $icon = h(rewriteInternalPathForRoute($atts['icon'] ?? '', $currentRoute));
            $title = h($atts['title'] ?? '');
            $text = h($atts['text'] ?? '');
            $button = h($atts['button'] ?? '');
            $arrow = h(prefixRootPath(rootPrefixForRoute($currentRoute), 'assets/icons/icon-iconbox-arrow.svg'));
            return <<<HTML
<div class="zunami-iconbox">
  <a class="zunami-iconbox__inner" href="{$href}">
    <div class="zunami-iconbox__icon"><img src="{$icon}" alt=""></div>
    <div class="zunami-iconbox__content">
      <div class="zunami-iconbox__content-inner">
        <div class="zunami-iconbox__title"><h4>{$title}</h4></div>
        <div class="zunami-iconbox__text">{$text}</div>
        <div class="zunami-iconbox__button"><span>{$button}</span><img src="{$arrow}" alt=""></div>
      </div>
    </div>
  </a>
</div>
HTML;
        },
        '/\[zunami_hblock\s+([^\]]+)\]/' => static function (array $matches) use ($currentRoute): string {
            $atts = parseShortcodeAttributes($matches[1]);
            $url = h(rewriteInternalPathForRoute($atts['url'] ?? '', $currentRoute));
            $caption = $atts['caption'] ?? '';
            $text = h($atts['text'] ?? '');
            $button = h($atts['button'] ?? '');
            $href = isset($atts['href']) ? h(rewriteInternalPathForRoute($atts['href'], $currentRoute)) : '';
            $icon = h(prefixRootPath(rootPrefixForRoute($currentRoute), 'assets/icons/icon-license.svg'));
            $buttonHtml = $href !== '' ? '<div><a class="zunami-button zunami-button_simple" href="' . $href . '">' . $button . '</a></div>' : '';
            $textHtml = $text !== '' ? '<div class="zunami-hblock__text">' . $text . '</div>' : '';
            return <<<HTML
<div class="zunami-hblock">
  <div class="zunami-hblock__left">
    <a class="zunami-hblock__link" href="{$url}">
      <div class="zunami-hblock__icon"><img src="{$icon}" alt=""></div>
      <div class="zunami-hblock__caption">{$caption}</div>
    </a>
  </div>
  <div class="zunami-hblock__right">
    {$textHtml}
    {$buttonHtml}
  </div>
</div>
HTML;
        },
        '/\[countdown\s+([^\]]+)\]/' => static function (array $matches): string {
            $atts = parseShortcodeAttributes($matches[1]);
            $from = h($atts['from'] ?? '0');
            $to = h($atts['to'] ?? '0');
            $before = h($atts['before'] ?? '');
            $after = h($atts['after'] ?? '');
            return '<span class="zunami-countdown js-countdown" data-from="' . $from . '" data-to="' . $to . '" data-before="' . $before . '" data-after="' . $after . '"><span class="zunami-countdown__before">' . $before . '</span><span class="zunami-countdown__value">' . $from . '</span><span class="zunami-countdown__after">' . $after . '</span></span>';
        },
        '/\[item-with-num\s+([^\]]+)\]/' => static function (array $matches): string {
            $atts = parseShortcodeAttributes($matches[1]);
            return '<div class="item-with-num"><span>' . h($atts['num'] ?? '') . '</span><p>' . h($atts['text'] ?? '') . '</p></div>';
        },
        '/\[hscroll-bar\]/' => static fn(): string => '<div class="hscroll-bar-holder"><span class="hscroll-bar-pin"></span><span class="hscroll-bar"></span></div>',
        '/\[zunami_news(?:\s+([^\]]+))?\]/' => static function (array $matches) use ($latestPosts, $currentRoute): string {
            $atts = parseShortcodeAttributes($matches[1] ?? '');
            $extraClass = trim((string) ($atts['class'] ?? ''));
            $cards = [];
            foreach ($latestPosts as $post) {
                $cards[] = renderArticleCard($post, $currentRoute, false);
            }
            return '<div class="zunami-post-grid ' . h($extraClass) . '">' . implode("\n", $cards) . '</div>';
        },
        '/\[contact-form-7\s+([^\]]+)\]/' => static function (array $matches) use ($currentRoute, $formDefinitions): string {
            $atts = parseShortcodeAttributes($matches[1]);
            $title = $atts['title'] ?? '';
            if (!isset($formDefinitions[$title])) {
                return '';
            }
            return renderStaticForm($currentRoute, $formDefinitions[$title], $title === 'Обратная связь' ? 'feedback' : 'request');
        },
        '/\[ya-map\s+([^\]]+)\]/' => static function (array $matches): string {
            $atts = parseShortcodeAttributes($matches[1]);
            $lat = h($atts['lat'] ?? '54.719602');
            $lon = h($atts['lon'] ?? '20.503795');
            $zoom = h($atts['zoom'] ?? '14');
            $apikey = h($atts['apikey'] ?? '');
            return '<div class="ya-map-holder" data-map data-apikey="' . $apikey . '" data-lat="' . $lat . '" data-lon="' . $lon . '" data-zoom="' . $zoom . '"></div>';
        },
        '/\[date\s+([^\]]+)\]/' => static function (array $matches): string {
            $atts = parseShortcodeAttributes($matches[1]);
            $delta = (int) ($atts['delta'] ?? 0);
            $format = (string) ($atts['format'] ?? 'Y');
            return date($format, time() + $delta * 86400);
        },
    ];

    foreach ($replacements as $pattern => $callback) {
        $content = (string) preg_replace_callback($pattern, $callback, $content);
    }

    return $content;
}

function parseShortcodeAttributes(string $source): array
{
    $attributes = [];
    preg_match_all('/([\w-]+)="([^"]*)"/u', $source, $matches, PREG_SET_ORDER);
    foreach ($matches as $match) {
        $attributes[$match[1]] = decodeSqlValue($match[2]);
    }

    return $attributes;
}

function renderArticleCard(array $post, string $currentRoute, bool $isHidden): string
{
    $cardRoute = trim((string) $post['post_name'], '/');
    $date = formatDate((string) $post['post_date']);
    $excerpt = h(makeExcerpt((string) $post['post_content'], 80));
    $title = h((string) $post['post_title']);
    $articleClass = $isHidden ? 'article-card is-hidden' : 'article-card';
    $hiddenAttr = $isHidden ? ' data-is-hidden' : '';
    $href = $cardRoute !== '' ? h(linkToRoute($currentRoute, $cardRoute)) : './';
    $image = prefixRootPath(rootPrefixForRoute($currentRoute), (string) ($post['thumbnail_path'] ?? 'assets/icons/favicon.svg'));
    $imageClass = isset($post['thumbnail_path']) && str_starts_with((string) $post['thumbnail_path'], 'wp-content/')
        ? 'article-box__image'
        : 'article-box__image article-box__image--placeholder';

    return <<<HTML
<article class="{$articleClass}"{$hiddenAttr}>
  <a class="article-box" href="{$href}">
    <img src="{$image}" alt="" class="{$imageClass}" loading="lazy">
    <h3 class="article-box-title">{$title}</h3>
    <div class="article-box-content">{$excerpt}</div>
    <div class="article-box-date">{$date}</div>
  </a>
</article>
HTML;
}

function renderEntryHeader(string $currentRoute, string $title): string
{
    $homeHref = h(linkToRoute($currentRoute, ''));
    $current = h($title);

    return <<<HTML
<header class="entry-header">
  <h1 class="entry-title">{$current}</h1>
  <div class="entry-breadcrumps">
    <a href="{$homeHref}">главная</a> / <span class="bc_current">{$current}</span>
  </div>
</header>
HTML;
}

function rootPrefixForRoute(string $route): string
{
    if ($route === '' || $route === '404.html') {
        return './';
    }

    $segments = array_values(array_filter(explode('/', trim($route, '/')), static fn(string $segment): bool => $segment !== ''));
    return str_repeat('../', count($segments));
}

function linkToRoute(string $fromRoute, string $toRoute): string
{
    $rootPrefix = rootPrefixForRoute($fromRoute);
    if ($toRoute === '' || $toRoute === 'home') {
        return $rootPrefix;
    }

    if ($toRoute === '404.html') {
        return $rootPrefix . '404.html';
    }

    return $rootPrefix . trim($toRoute, '/') . '/';
}

function prefixRootPath(string $rootPrefix, string $path): string
{
    return $rootPrefix . ltrim($path, '/');
}

function rewriteInternalPathForRoute(string $path, string $currentRoute): string
{
    if ($path === '' || str_starts_with($path, '#') || str_starts_with($path, 'mailto:') || str_starts_with($path, 'tel:')) {
        return $path;
    }

    if (preg_match('#^https?://#i', $path)) {
        if (!str_starts_with($path, ZUNAMI_SITE_URL)) {
            return $path;
        }
        $path = substr($path, strlen(ZUNAMI_SITE_URL));
    }

    if (!str_starts_with($path, '/')) {
        return $path;
    }

    $path = rewriteKnownRouteAliasPath($path, getRouteAliases());
    return prefixPath($path, rootPrefixForRoute($currentRoute));
}

function rewriteContentUrls(string $html, string $currentRoute): string
{
    $html = str_replace([ZUNAMI_SITE_URL . '/', ZUNAMI_SITE_URL], ['/', ''], $html);
    $rootPrefix = rootPrefixForRoute($currentRoute);
    $routeAliases = getRouteAliases();

    $html = (string) preg_replace_callback(
        '/\b(href|src|action|poster)=("|\')(\/[^"\']*)\2/i',
        static fn(array $matches): string => $matches[1] . '=' . $matches[2] . prefixPath(rewriteKnownRouteAliasPath($matches[3], $routeAliases), $rootPrefix) . $matches[2],
        $html
    );

    $html = (string) preg_replace_callback(
        '/\bsrcset=("|\')([^"\']+)\1/i',
        static function (array $matches) use ($rootPrefix): string {
            $sources = array_map('trim', explode(',', $matches[2]));
            $rewritten = [];
            foreach ($sources as $source) {
                if ($source === '') {
                    continue;
                }
                $parts = preg_split('/\s+/', $source, 2);
                $url = $parts[0] ?? '';
                $descriptor = $parts[1] ?? '';
                $rewritten[] = prefixPath(rewriteKnownRouteAliasPath($url, $routeAliases), $rootPrefix) . ($descriptor !== '' ? ' ' . $descriptor : '');
            }
            return 'srcset=' . $matches[1] . implode(', ', $rewritten) . $matches[1];
        },
        $html
    );

    return $html;
}

function rewriteKnownRouteAliasPath(string $path, array $routeAliases): string
{
    if ($path === '' || !str_starts_with($path, '/')) {
        return $path;
    }

    $pathOnly = $path;
    $suffix = '';

    if (str_contains($pathOnly, '#')) {
        [$pathOnly, $hash] = explode('#', $pathOnly, 2);
        $suffix = '#' . $hash;
    }

    if (str_contains($pathOnly, '?')) {
        [$pathOnly, $query] = explode('?', $pathOnly, 2);
        $suffix = '?' . $query . $suffix;
    }

    $trimmed = trim($pathOnly, '/');
    if ($trimmed === '' || str_contains(basename($trimmed), '.')) {
        return $path;
    }

    if (!isset($routeAliases[$trimmed])) {
        return $path;
    }

    return '/' . trim((string) $routeAliases[$trimmed], '/') . '/' . $suffix;
}

function prefixPath(string $path, string $rootPrefix): string
{
    if ($path === '' || $path === '/') {
        return $rootPrefix;
    }

    if (!str_starts_with($path, '/')) {
        return $path;
    }

    $pathOnly = $path;
    $suffix = '';

    if (str_contains($pathOnly, '#')) {
        [$pathOnly, $hash] = explode('#', $pathOnly, 2);
        $suffix = '#' . $hash;
    }

    if (str_contains($pathOnly, '?')) {
        [$pathOnly, $query] = explode('?', $pathOnly, 2);
        $suffix = '?' . $query . $suffix;
    }

    $trimmed = trim($pathOnly, '/');
    $basename = basename($trimmed);
    $hasExtension = str_contains($basename, '.');
    if (!$hasExtension && !str_ends_with($trimmed, '/')) {
        $trimmed .= '/';
    }

    return $rootPrefix . $trimmed . $suffix;
}

function routeToFilePath(string $projectRoot, string $route): string
{
    if ($route === '' || $route === 'home') {
        return $projectRoot . DIRECTORY_SEPARATOR . 'index.html';
    }

    if ($route === '404.html') {
        return $projectRoot . DIRECTORY_SEPARATOR . '404.html';
    }

    return $projectRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, trim($route, '/')) . DIRECTORY_SEPARATOR . 'index.html';
}

function safeWrite(string $path, string $content): void
{
    $directory = dirname($path);
    if (!is_dir($directory)) {
        mkdir($directory, 0777, true);
    }

    file_put_contents($path, $content);
}

function writeJson(string $path, array $data): void
{
    safeWrite(
        $path,
        (string) json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
    );
}

function formatDate(string $date): string
{
    $timestamp = strtotime($date);
    return $timestamp === false ? $date : date('d.m.Y', $timestamp);
}

function makeExcerpt(string $content, int $length): string
{
    $content = decodeSqlValue($content);
    $content = preg_replace('/<!--.*?-->/s', ' ', $content);
    $content = preg_replace('/\[[^\]]+\]/', ' ', (string) $content);
    $content = html_entity_decode(strip_tags((string) $content), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $content = preg_replace('/\s+/u', ' ', trim((string) $content));

    if (u_strlen($content) <= $length) {
        return $content;
    }

    return rtrim(u_substr($content, 0, $length)) . '…';
}

function needsPageHeader(int $pageId): bool
{
    return in_array($pageId, [3, 75, 77, 79, 81, 83, 114, 117, 119, 121, 123, 127, 129, 131], true);
}

function resolveActiveMenuForRoute(string $route): string
{
    if ($route === '' || $route === 'home') {
        return 'home';
    }
    if (str_starts_with($route, 'company')) {
        return 'company';
    }
    if ($route === 'uslugi') {
        return 'uslugi';
    }
    if ($route === 'contacts') {
        return 'contacts';
    }
    if ($route === 'blog') {
        return 'blog';
    }

    return '';
}

function isMenuItemActive(string $currentRoute, string $itemRoute, string $activeMenu): bool
{
    if ($itemRoute === '') {
        return $currentRoute === '';
    }

    return $activeMenu !== ''
        ? ($itemRoute === $activeMenu || str_starts_with($currentRoute, $itemRoute))
        : $currentRoute === $itemRoute;
}

function slugifyRoute(string $route): string
{
    $slug = trim($route, '/');
    return $slug === '' ? 'home' : str_replace('/', '-', $slug);
}

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function u_strlen(string $value): int
{
    if ($value === '') {
        return 0;
    }

    preg_match_all('/./us', $value, $matches);
    return count($matches[0]);
}

function u_substr(string $value, int $start, int $length): string
{
    if ($value === '') {
        return '';
    }

    preg_match_all('/./us', $value, $matches);
    return implode('', array_slice($matches[0], $start, $length));
}
