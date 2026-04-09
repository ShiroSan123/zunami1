<?php
/**
 * The template for displaying 404 pages (not found)
 *
 * @link https://codex.wordpress.org/Creating_an_Error_404_Page
 *
 * @package Zunami_insurance_broker_theme
 */

get_header();
?>
<main id="primary" class="site-main">
	<article id="not-found" <?php post_class(); ?>>
		<div class="entry-content">
			<?= get_post_field('post_content', 380); ?>
		</div>
	</article>
</main>
<?php
get_footer();
