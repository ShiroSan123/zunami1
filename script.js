(function ($) {
  const $body = $("body");
  const $header = $("#siteHeader");
  const $burger = $("#burger");
  const $mobileMenu = $("#mobileMenu");
  const $mobileOverlay = $("#mobileMenuOverlay");
  const $stories = $(".stories");
  const $storiesTrack = $("#storiesTrack");

  const toggleMenu = (force) => {
    const isOpen = typeof force === "boolean" ? force : !$body.hasClass("menu-open");
    $body.toggleClass("menu-open", isOpen);
    $mobileMenu.attr("aria-hidden", !isOpen);
  };

  $burger.on("click", () => toggleMenu());
  $mobileOverlay.on("click", () => toggleMenu(false));
  $(document).on("click", ".mobile-menu__nav a", () => toggleMenu(false));

  const handleSticky = () => {
    $header.toggleClass("is-sticky", $(window).scrollTop() > 10);
  };

  $(window).on("scroll", handleSticky);
  handleSticky();

  $(document).on("click", "[data-scroll]", function (event) {
    const target = $(this).data("scroll");
    if (!target) {
      return;
    }
    const $target = $(target);
    if (!$target.length) {
      return;
    }
    event.preventDefault();
    $("html, body").animate({ scrollTop: $target.offset().top - 20 }, 500);
  });

  $(document).on("click", "a[href^='#']", function (event) {
    const href = $(this).attr("href");
    if (!href || href === "#") {
      return;
    }
    const $target = $(href);
    if (!$target.length) {
      return;
    }
    event.preventDefault();
    $("html, body").animate({ scrollTop: $target.offset().top - 20 }, 500);
  });

  $(document).on("click", ".faq__question", function () {
    const $btn = $(this);
    const isOpen = $btn.attr("aria-expanded") === "true";
    const $item = $btn.closest(".faq__item");

    $(".faq__question").attr("aria-expanded", "false");
    $(".faq__answer").attr("hidden", true).slideUp(200);

    if (!isOpen) {
      $btn.attr("aria-expanded", "true");
      $item.find(".faq__answer").attr("hidden", false).slideDown(200);
    }
  });

  const updateStoriesParallax = () => {
    if (!$storiesTrack.length) {
      return;
    }
    const maxScrollLeft = $storiesTrack[0].scrollWidth - $storiesTrack[0].clientWidth;
    const atEnd = maxScrollLeft <= 0 || $storiesTrack[0].scrollLeft >= maxScrollLeft - 4;
    $stories.toggleClass("is-parallax", atEnd);
  };

  $storiesTrack.on("scroll", updateStoriesParallax);
  $(window).on("resize", updateStoriesParallax);
  updateStoriesParallax();

  $(document).on("click", "[data-stories]", function () {
    if (!$storiesTrack.length) {
      return;
    }
    const direction = $(this).data("stories");
    const cardWidth = $storiesTrack.find(".story").first().outerWidth(true) || 320;
    const delta = direction === "prev" ? -cardWidth : cardWidth;
    $storiesTrack.animate({ scrollLeft: $storiesTrack.scrollLeft() + delta }, 300);
  });
})(jQuery);
