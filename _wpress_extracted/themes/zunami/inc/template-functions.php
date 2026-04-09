<?php
/**
 * Functions which enhance the theme by hooking into WordPress
 *
 * @package Zunami_insurance_broker_theme
 */

/**
 * Adds custom classes to the array of body classes.
 *
 * @param array $classes Classes for the body element.
 * @return array
 */
function zunami_body_classes( $classes ) {
	// Adds a class of hfeed to non-singular pages.
	if ( ! is_singular() ) {
		$classes[] = 'hfeed';
	}

	// Adds a class of no-sidebar when there is no sidebar present.
	if ( ! is_active_sidebar( 'sidebar-1' ) ) {
		$classes[] = 'no-sidebar';
	}

	return $classes;
}
add_filter( 'body_class', 'zunami_body_classes' );

/**
 * Add a pingback url auto-discovery header for single posts, pages, or attachments.
 */
function zunami_pingback_header() {
	if ( is_singular() && pings_open() ) {
		printf( '<link rel="pingback" href="%s">', esc_url( get_bloginfo( 'pingback_url' ) ) );
	}
}
add_action( 'wp_head', 'zunami_pingback_header' );

function zunami_widgets_init() {

    register_sidebar([
        'name'          => __( 'Footer 1', 'zunami' ),
        'id'            => 'footer-1-widget-area',
        'description'   => '',
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '',
        'after_title'   => '',
    ]);
    register_sidebar([
        'name'          => __( 'Footer 2', 'zunami' ),
        'id'            => 'footer-2-widget-area',
        'description'   => '',
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '',
        'after_title'   => '',
    ]);
    register_sidebar([
        'name'          => __( 'Footer 3', 'zunami' ),
        'id'            => 'footer-3-widget-area',
        'description'   => '',
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '',
        'after_title'   => '',
    ]);
    register_sidebar([
        'name'          => __( 'Footer 4', 'zunami' ),
        'id'            => 'footer-4-widget-area',
        'description'   => '',
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '',
        'after_title'   => '',
    ]);
    register_sidebar([
        'name'          => __( 'Footer 5', 'zunami' ),
        'id'            => 'footer-5-widget-area',
        'description'   => '',
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '',
        'after_title'   => '',
    ]);
    register_sidebar([
        'name'          => __( 'Footer 6', 'zunami' ),
        'id'            => 'footer-6-widget-area',
        'description'   => '',
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '',
        'after_title'   => '',
    ]);



	register_sidebar([
		'name'          => esc_html__( 'Mobile menu bottom', 'zunami' ),
		'id'            => 'mobile-widget-area',
        'description'   => '',
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '',
        'after_title'   => '',
	]);

}
add_action( 'widgets_init', 'zunami_widgets_init' );




add_shortcode( 'zunami_iconbox', 'shortcode_zunami_iconbox' );
function shortcode_zunami_iconbox( $atts ) {

    $html  = "<div class='zunami-iconbox'>";
    $html .= "<a class='zunami-iconbox__inner' href='{$atts["href"]}'>";
    $html .=    "<div class='zunami-iconbox__icon'>";
    $html .=       "<img src='{$atts["icon"]}' alt='Иконка {$atts["title"]}'>";
    $html .=    "</div>";
    $html .=    "<div class='zunami-iconbox__content'>";
    $html .=       "<div class='zunami-iconbox__content-inner'>";
    $html .=           "<div class='zunami-iconbox__title'><h4>{$atts["title"]}</h4></div>";
    $html .=            "<div class='zunami-iconbox__text'>{$atts["text"]}</div>";
    $html .=            "<div class='zunami-iconbox__button'>";
    $html .=                "<span>{$atts["button"]}</span>";
    $html .=                "<img src='" . get_template_directory_uri() . "/icons/icon-iconbox-arrow.svg' alt='Получить' />";
    $html .=            "</div>";
    $html .=        "</div>";
    $html .=    "</div>";
    $html .= "</a>";
    $html .= "</div>";

    return $html;
}

add_shortcode( 'zunami_hblock', 'shortcode_zunami_hblock' );
function shortcode_zunami_hblock( $atts ) {

    $html  = "<div class='zunami-hblock'>";
    $html .= "<div class='zunami-hblock__left'>";
    $html .=    "<a class='zunami-hblock__link' href='{$atts["url"]}'>";
    $html .=       "<div class='zunami-hblock__icon'>";
    $html .=          "<img src='" . get_template_directory_uri() . "/icons/icon-license.svg' alt='Иконка документа'>";
    $html .=       "</div>";
    $html .=        "<div class='zunami-hblock__caption'>{$atts["caption"]}</div>";
    $html .=    "</a>";
    $html .= "</div>";
    $html .= "<div class='zunami-hblock__right'>";
    if ($atts["text"] ?? false) {
        $html .=    "<div class='zunami-hblock__text'>{$atts["text"]}</div>";
    }
    if ($atts["href"] ?? false) {
        $html .=    "<div><a class='zunami-button zunami-button_simple' href='{$atts["href"]}'>{$atts["button"]}</a></div>";
    }
    $html .= "</div>";
    $html .= "</div>";

    return $html;
}

add_shortcode( 'zunami_news', 'shortcode_zunami_news' );
function shortcode_zunami_news( $atts ) {
    ob_start();

    $class = $atts["class"] ?? "";

    echo "<div class='zunami-post-grid {$class}'>";

    $args = [
        'post_type'  => 'post',
        'post_status' => 'publish',
        'posts_per_page' => $atts["count"] ?? 3,
        'orderby' => 'post_date',
        'order' => 'DESC',
    ];
    $most_recent = new WP_Query( $args );
    if ( $most_recent->have_posts() ) {
        while ( $most_recent->have_posts() ) {
            $most_recent->the_post();
            get_template_part( 'template-parts/content', get_post_type() );
        }
        wp_reset_postdata();
    }

    echo '</div>';

    $html = ob_get_contents();
    ob_end_clean();
    return $html;
}

add_shortcode( 'countdown', 'shortcode_countdown' );
function shortcode_countdown( $atts ) {

    $html  = "<span class='zunami-countdown' animate-on-visible style='--from:{$atts["from"]}; --to:{$atts["to"]};'>";
    if ($atts["before"] ?? false) {
        $html .=    "{$atts["before"]}";
    }
    $html .= "<span class='zunami-countdown__value'></span>";
    if ($atts["after"] ?? false) {
        $html .=    "{$atts["after"]}";
    }
    $html .= "</span>";

    return $html;
}

add_shortcode( 'rotating-star', 'shortcode_star' );
function shortcode_star( $atts ) {

    $html  = "<div class='zunami-rotating-star'>";
    $html .= "<img src='" . get_template_directory_uri() . "/icons/icon-star.svg' alt='Звезда'>";
    $html .= "<span class='zunami-rotating-star__caption {$atts["class"]}'>{$atts["caption"]}</span>";
    $html .= "</div>";

    return $html;
}
add_shortcode( 'date', 'shortcode_date' );
function shortcode_date( $atts ) {
    return date($atts["format"] ?? "Y", time() + 86400 * ($atts["delta"] ?? 0));
}

add_shortcode( 'typing', 'shortcode_typing' );
function shortcode_typing( $atts ) {
    return "<{$atts["tag"]} class='{$atts["class"]} typing-animation' animate-on-visible><span class='typing-text'>{$atts["text"]}</span><span class='typing-caret'>|</span></h1>";
}


add_shortcode( 'item-with-num', 'shortcode_item_with_num' );
function shortcode_item_with_num( $atts ) {
    return "<div class='item-with-num'><span>{$atts['num']}</span><p>{$atts['text']}</p></div>";
}

add_shortcode( 'hscroll-bar', 'shortcode_hscroll_bar' );
function shortcode_hscroll_bar( $atts ) {
    return "<div class='hscroll-bar-holder'><span class='hscroll-bar-pin'></span><span class='hscroll-bar'></span></div>";
}


add_shortcode( 'ya-map', 'shortcode_ya_map' );
function shortcode_ya_map( $atts ) {
    ob_start();
    get_template_part( 'template-parts/ya-map', null, $atts );
    $html = ob_get_contents();
    ob_end_clean();
    return $html;
}




add_shortcode( 'navmenu', 'shortcode_navmenu' );
function shortcode_navmenu( $atts ) {
	wp_nav_menu(["menu" => $atts["menu_id"] ?? 0, "container_class" => "widget_nav_menu"]);
	return "";
}


add_action( 'wp_ajax_search', 'zunami_search' );
add_action( 'wp_ajax_nopriv_search', 'zunami_search' );
function zunami_search() {
    $q = new WP_Query( array(
        'post_type' => ['post', 'page'],
        's' => $_REQUEST["s"] ?? "",
    ));

    $result = ["posts" => [], "count" => 0];

    while ( $q->have_posts() ) {
        $q->the_post();
        $result["count"] ++;
        $result["posts"][] = [
            "title" => get_the_title(),
            "link" => get_permalink(),
        ];
    }

    wp_send_json_success( $result );

}
