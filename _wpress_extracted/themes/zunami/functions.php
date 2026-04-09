<?php
/**
 * Zunami insurance broker theme functions and definitions
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package Zunami_insurance_broker_theme
 */

if ( ! defined( '_S_VERSION' ) ) {
	// Replace the version number of the theme on each release.
	define( '_S_VERSION', '1.0.0' );
}

/**
 * Sets up theme defaults and registers support for various WordPress features.
 *
 * Note that this function is hooked into the after_setup_theme hook, which
 * runs before the init hook. The init hook is too late for some features, such
 * as indicating support for post thumbnails.
 */
function zunami_setup() {
	/*
		* Make theme available for translation.
		* Translations can be filed in the /languages/ directory.
		* If you're building a theme based on Zunami insurance broker theme, use a find and replace
		* to change 'zunami' to the name of your theme in all the template files.
		*/
	load_theme_textdomain( 'zunami', get_template_directory() . '/languages' );

	// Add default posts and comments RSS feed links to head.
	add_theme_support( 'automatic-feed-links' );

	/*
		* Let WordPress manage the document title.
		* By adding theme support, we declare that this theme does not use a
		* hard-coded <title> tag in the document head, and expect WordPress to
		* provide it for us.
		*/
	add_theme_support( 'title-tag' );

	/*
		* Enable support for Post Thumbnails on posts and pages.
		*
		* @link https://developer.wordpress.org/themes/functionality/featured-images-post-thumbnails/
		*/
	add_theme_support( 'post-thumbnails' );

	// This theme uses wp_nav_menu() in one location.
	register_nav_menus(
		array(
			'menu-1' => esc_html__( 'Primary', 'zunami' ),
		)
	);

	/*
		* Switch default core markup for search form, comment form, and comments
		* to output valid HTML5.
		*/
	add_theme_support(
		'html5',
		array(
			'search-form',
			'comment-form',
			'comment-list',
			'gallery',
			'caption',
			'style',
			'script',
		)
	);

	// Set up the WordPress core custom background feature.
	add_theme_support(
		'custom-background',
		apply_filters(
			'zunami_custom_background_args',
			array(
				'default-color' => 'ffffff',
				'default-image' => '',
			)
		)
	);

	// Add theme support for selective refresh for widgets.
	add_theme_support( 'customize-selective-refresh-widgets' );

	/**
	 * Add support for core custom logo.
	 *
	 * @link https://codex.wordpress.org/Theme_Logo
	 */
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 250,
			'width'       => 250,
			'flex-width'  => true,
			'flex-height' => true,
		)
	);
}
add_action( 'after_setup_theme', 'zunami_setup' );

/**
 * Set the content width in pixels, based on the theme's design and stylesheet.
 *
 * Priority 0 to make it available to lower priority callbacks.
 *
 * @global int $content_width
 */
function zunami_content_width() {
	$GLOBALS['content_width'] = apply_filters( 'zunami_content_width', 640 );
}
add_action( 'after_setup_theme', 'zunami_content_width', 0 );

/**
 * Enqueue scripts and styles.
 */
function zunami_scripts() {
	wp_enqueue_style( 'zunami-style', get_stylesheet_uri(), [], _S_VERSION );
	wp_style_add_data( 'zunami-style', 'rtl', 'replace' );
	wp_enqueue_style( 'zunami-style-variables', get_template_directory_uri() . '/css/variables.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-font', get_template_directory_uri() . '/css/font.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-main', get_template_directory_uri() . '/css/main.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-header', get_template_directory_uri() . '/css/header.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-page', get_template_directory_uri() . '/css/page.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-footer', get_template_directory_uri() . '/css/footer.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-animation', get_template_directory_uri() . '/css/animation.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-front-page', get_template_directory_uri() . '/css/front-page.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-elements', get_template_directory_uri() . '/css/elements.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-animate', get_template_directory_uri() . '/css/animate.min.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-article-box', get_template_directory_uri() . '/css/elements/article-box.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-zunami-iconbox', get_template_directory_uri() . '/css/elements/zunami-iconbox.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-zunami-button', get_template_directory_uri() . '/css/elements/zunami-button.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-zunami-post-grid', get_template_directory_uri() . '/css/elements/zunami-post-grid.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-zunami-hblock', get_template_directory_uri() . '/css/elements/zunami-hblock.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-zunami-animation', get_template_directory_uri() . '/css/elements/zunami-animation.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-zunami-step-block', get_template_directory_uri() . '/css/elements/zunami-step-block.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-parralax-container', get_template_directory_uri() . '/css/elements/parralax-container.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-zunami-history-block', get_template_directory_uri() . '/css/elements/zunami-history-block.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-accordion', get_template_directory_uri() . '/css/elements/accordion.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-zunami-countdown', get_template_directory_uri() . '/css/elements/zunami-countdown.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-form-field', get_template_directory_uri() . '/css/elements/form-field.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-entry-breadcrumps', get_template_directory_uri() . '/css/elements/entry-breadcrumps.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-modal-window', get_template_directory_uri() . '/css/elements/modal-window.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-search-popup', get_template_directory_uri() . '/css/elements/search-popup.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-zunami-item-with-num', get_template_directory_uri() . '/css/elements/zunami-item-with-num.css', [], _S_VERSION );
	wp_enqueue_style( 'zunami-style-hscroll-bar', get_template_directory_uri() . '/css/elements/hscroll-bar.css', [], _S_VERSION );

	// wp_enqueue_script( 'zunami-gsap', get_template_directory_uri() . '/js/gsap.min.js', [], _S_VERSION, true );

	wp_enqueue_script( 'zunami-navigation', get_template_directory_uri() . '/js/navigation.js', [], _S_VERSION, true );
	wp_enqueue_script( 'zunami-theme', get_template_directory_uri() . '/js/theme.js', [], _S_VERSION, true );


	wp_deregister_script('jquery-core');
	wp_deregister_script('jquery');

	wp_register_script('jquery-core', 'https://code.jquery.com/jquery-3.7.1.min.js', false, null, true);
	wp_register_script('jquery-migrate', 'https://code.jquery.com/jquery-migrate-3.4.1.min.js', false, null, true);
	wp_register_script('jquery', false, ['jquery-core', 'jquery-migrate'], null, true);
	wp_enqueue_script('jquery');


	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'zunami_scripts' );


/**
 * Implement the Custom Header feature.
 */
require get_template_directory() . '/inc/custom-header.php';

/**
 * Custom template tags for this theme.
 */
require get_template_directory() . '/inc/template-tags.php';

/**
 * Functions which enhance the theme by hooking into WordPress.
 */
require get_template_directory() . '/inc/template-functions.php';

/**
 * Customizer additions.
 */
require get_template_directory() . '/inc/customizer.php';

/**
 * Load Jetpack compatibility file.
 */
if ( defined( 'JETPACK__VERSION' ) ) {
	require get_template_directory() . '/inc/jetpack.php';
}

