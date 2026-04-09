<?php
/**
 * Template part for displaying posts
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package Zunami_insurance_broker_theme
 */

?>

<article id="post-<?php the_ID(); ?>" <?php post_class(); ?> <?= ($args['isHidden'] ?? false) ? "data-is-hidden" : "" ?>>
	<a class="article-box" href="<?= esc_url( get_permalink() ) ?>">
		<?php the_post_thumbnail('post-thumbnail', ['alt' => the_title_attribute(['echo' => false])]); ?>
		<?php the_title( '<h3 class="article-box-title">', '</h3>' ); ?>
		<div class="article-box-content"><?= mb_substr(wp_strip_all_tags(get_the_content()), 0, 80) . "..." ?></div>
		<div class="article-box-date"><?= get_the_date("d.m.Y") ?></div>
	</a>
</article><!-- #post-<?php the_ID(); ?> -->
