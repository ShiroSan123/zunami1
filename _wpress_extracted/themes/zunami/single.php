<?php
/**
 * The template for displaying all single posts
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/#single-post
 *
 * @package Zunami_insurance_broker_theme
 */

get_header();
?>
<main id="primary" class="site-main">
	<?php if ( have_posts() ) { ?>
		<?php the_post(); ?>
		<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
			<?php the_title( '<h1>', '</h1>' ); ?>
			<div class="article-box-meta">
				<div class="article-box-date"><?= get_the_date("d.m.Y") ?></div>
				<div class="article-box-terms">
				<?php $categories = wp_get_post_categories(get_the_ID()) ?>	
				<?php foreach ($categories as $tid) { ?>
					<?php $term = get_term($tid, "category"); ?>
					<a href="<?= get_term_link($term) ?>"><?= $term->name ?></a>
				<?php } ?>
				</div>
				<?php $postMeta = get_post_meta(get_the_ID()); ?>
				<?php if ($readingTime = $postMeta["reading_time"][0] ?? false) { ?>
					<div class="article-reading-time">Время чтения: <?= $readingTime ?></div>
				<?php } ?>
			</div>
			<?php the_post_thumbnail('post-thumbnail', ['alt' => the_title_attribute(['echo' => false])]); ?>
			<div class="entry-content">
				<?php the_content(); ?>
			</div>
			<div class="article-share-links">
				<a href="http://vk.com/share.php?url=<?= esc_url( get_permalink() ) ?>&title=<?= get_the_title() ?>&description={$desc}&image=<?= get_the_post_thumbnail('post-thumbnail') ?>&noparse=true" target="_blank" rel="nofollow">Поделиться в ВК</a>
			</div>
		</article>
	<?php } ?>
</main>
<?php
// get_sidebar();
get_footer();
