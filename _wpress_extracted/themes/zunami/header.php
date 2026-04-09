<?php
/**
 * The header for our theme
 *
 * This is the template that displays all of the <head> section and everything up until <div id="content">
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package Zunami_insurance_broker_theme
 */

?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="https://gmpg.org/xfn/11">

	<link rel="icon" type="image/png" sizes="32x32" href="<?= get_template_directory_uri() ?>/icons/favicon.png" media="(prefers-color-scheme: light)">
	<link rel="icon" type="image/png" sizes="32x32" href="<?= get_template_directory_uri() ?>/icons/favicon_black.png" media="(prefers-color-scheme: dark)">
	<link rel="icon" type="image/svg+xml" sizes="any" href="<?= get_template_directory_uri() ?>/icons/favicon.svg">
	<link rel="apple-touch-icon" type="image/png" href="<?= get_template_directory_uri() ?>/icons/favicon.png">
	<link rel="icon" type="image/png" sizes="192x192" href="<?= get_template_directory_uri() ?>/icons/favicon.png">

	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div id="page" class="site">
	<a class="skip-link screen-reader-text" href="#primary"><?php esc_html_e( 'Skip to content', 'zunami' ); ?></a>
	<div class="search-popup" id="search_popup">
		<div class="search-popup-inner">
			<form id="search_form">
				<div class="form-field form-field_has-icon">
					<div class="form-field__icon">
						<img src="<?= get_template_directory_uri() ?>/icons/search.svg" alt="Поиск">
					</div>
					<input class="search-input" type="text" id="search_input" placeholder="Поиск">
				</div>
			</form>
			<button class="close-button" id="search_popup_close" aria-label="Закрыть поиск">
				<img src="<?= get_template_directory_uri() ?>/icons/icon-close.svg" alt="Закрыть">
			</button>
		</div>
	</div>
	<div class="search-popup-results" id="search_popup_results">
		<div class="search-popup-inner" id="search_popup_results_text">
		</div>
	</div>

	<header id="masthead" class="site-header-holder">
		<div class="site-header">
			<div class="site-branding">
				<?php the_custom_logo(); ?>
			</div><!-- .site-branding -->

			<nav id="site-navigation" class="main-navigation animate__animated animate__fadeInDown">
				<?php
				wp_nav_menu([
					'theme_location' => 'menu-1',
					'menu_id'        => 'primary-menu',
				]);
				?>
			</nav><!-- #site-navigation -->


			<div class="top-icons">
				<button class="top-icon search-button" id="search_popup_open" aria-label="Поиск">
					<img src="<?= get_template_directory_uri() ?>/icons/search.svg" alt="Поиск" />
				</button>
				<button class="top-icon mobile-menu-button" id="mobile_menu_open" aria-label="Меню">
					<img src="<?= get_template_directory_uri() ?>/icons/icon-menu.svg" alt="Меню" />
				</button>
				<button class="zunami-button" id="open_main_popup">Отправить заявку <span class="button-arrow"></span></button>
			</div>
		</div>
		<div class="mobile-menu-holder" id="mobile_menu">
			<div></div>
			<nav id="site-navigation-mobile" class="mobile-navigation">
				<?php
				wp_nav_menu([
					'theme_location' => 'menu-1',
					'menu_id'        => 'primary-menu',
				]);
				?>
			</nav><!-- #site-navigation -->
		    <div class="mobile-menu-sidebar">
				<?php if ( is_active_sidebar( 'mobile-widget-area' ) ) { ?>
			        <?php dynamic_sidebar( 'mobile-widget-area' ); ?>
				<?php } ?>
		    </div>
		</div>
	</header><!-- #masthead -->			

<!-- <div>
	<button class="zunami-button">Отправить заявку <span class="button-arrow"></span></button>
</div> -->