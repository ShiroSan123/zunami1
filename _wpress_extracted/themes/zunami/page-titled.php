<?php
/* Template Name: Page with title */

get_header();
?>
<main id="primary" class="site-main">
	<?php if ( have_posts() ) { ?>
		<?php the_post(); ?>
		<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
			<header class="entry-header">
				<?php the_title( '<h1 class="entry-title">', '</h1>' ); ?>
				<div class="entry-breadcrumps"></div>
			</header>
			<div class="entry-content">
				<?php the_content(); ?>
			</div>
		</article>
	<?php } ?>
</main>
<?php
get_footer();
