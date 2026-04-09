<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the #content div and all content after.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package Zunami_insurance_broker_theme
 */

?>

	<footer id="colophon" class="site-footer">
		<div class="footer-inner">
			<div class="footer-row">
				<div class="footer-column">
					<div class="site-branding">
						<?php the_custom_logo(); ?>
					</div><!-- .site-branding -->
					<?php if ( is_active_sidebar( 'footer-1-widget-area' ) ) { ?>
					    <div id="sidebar">
					        <?php dynamic_sidebar( 'footer-1-widget-area' ); ?>
					    </div>
					<?php } ?>
				</div>
				<div class="footer-column">
					<?php if ( is_active_sidebar( 'footer-2-widget-area' ) ) { ?>
					    <div id="sidebar">
					        <?php dynamic_sidebar( 'footer-2-widget-area' ); ?>
					    </div>
					<?php } ?>
				</div>
				<div class="footer-column">
					<?php if ( is_active_sidebar( 'footer-3-widget-area' ) ) { ?>
					    <div id="sidebar">
					        <?php dynamic_sidebar( 'footer-3-widget-area' ); ?>
					    </div>
					<?php } ?>
				</div>
			</div>
			<div class="footer-row">
				<div class="footer-column">
					<?php if ( is_active_sidebar( 'footer-4-widget-area' ) ) { ?>
					    <div id="sidebar">
					        <?php dynamic_sidebar( 'footer-4-widget-area' ); ?>
					    </div>
					<?php } ?>
				</div>
				<div class="footer-column">
					<?php if ( is_active_sidebar( 'footer-5-widget-area' ) ) { ?>
					    <div id="sidebar">
					        <?php dynamic_sidebar( 'footer-5-widget-area' ); ?>
					    </div>
					<?php } ?>
				</div>
				<div class="footer-column">
					<?php if ( is_active_sidebar( 'footer-6-widget-area' ) ) { ?>
					    <div id="sidebar">
					        <?php dynamic_sidebar( 'footer-6-widget-area' ); ?>
					    </div>
					<?php } ?>
				</div>
			</div>
		</div>
	</footer><!-- #colophon -->
</div><!-- #page -->

<div class="modal-window" id="modal_request">
	<div class="modal-background"></div>
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-body">
				<h4>Создание заявки</h4>
				<?php echo do_shortcode('[contact-form-7 id="14d2396"]'); ?>
			</div>
		</div>
	</div>
</div>

<?php wp_footer(); ?>

</body>
</html>
