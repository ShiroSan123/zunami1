<?php
/**
 * The main template file
 *
 * This is the most generic template file in a WordPress theme
 * and one of the two required files for a theme (the other being style.css).
 * It is used to display a page when nothing more specific matches a query.
 * E.g., it puts together the home page when no home.php file exists.
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package Zunami_insurance_broker_theme
 */

get_header();
?>

	<main id="primary" class="site-main">

		<?php if ( have_posts() ) { ?>

			<?php if ( is_home() && ! is_front_page() ) { ?>
				<header class="entry-header">
					<h1 class="page-title"><?php single_post_title(); ?></h1>
					<div class="entry-breadcrumps">
						<a href="/">главная</a> / <a class="bc_current" href="/blog/">блог</a>
					</div>
				</header>
			<?php } ?>
			<div class="zunami-post-grid">
				<?php $i = 0; ?>
				<?php while ( have_posts() ) { ?>
					<?php the_post(); ?>
					<?php get_template_part( 'template-parts/content', get_post_type(), ["isHidden" => ++$i > 9] ); ?>
				<?php } ?>
			</div>

			<div style="display: flex; justify-content: center;">
				<button class="zunami-button zunami-button_simple" id="load_more_posts">Еще новости</button>
			</div>
		<?php } else { ?>
			<?php get_template_part( 'template-parts/content', 'none' ); ?>
		<?php } ?>
	</main><!-- #main -->

<?php
get_footer();
