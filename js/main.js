(function () {
  "use strict";

  var header = document.querySelector("[data-header]");
  var navToggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");

  // Header solidifies on scroll.
  var onScroll = function () {
    if (window.scrollY > 8) header.setAttribute("data-scrolled", "");
    else header.removeAttribute("data-scrolled");
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile nav toggle.
  navToggle.addEventListener("click", function () {
    var open = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!open));
    if (open) mobileNav.removeAttribute("data-open");
    else mobileNav.setAttribute("data-open", "");
  });
  mobileNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      navToggle.setAttribute("aria-expanded", "false");
      mobileNav.removeAttribute("data-open");
    });
  });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Content reveal uses IntersectionObserver, not scroll-position math: it
  // checks each element's real state the moment it's observed, so it can
  // never strand real content (services, testimonials, contact) at
  // opacity:0 because a scroll-linked calculation went stale after a
  // late web-font swap reflowed the page.
  var revealEls = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  var heroEls = revealEls.filter(function (el) { return el.closest(".hero"); });
  var contentEls = revealEls.filter(function (el) { return !el.closest(".hero"); });

  if (!reduceMotion && "IntersectionObserver" in window) {
    document.body.classList.add("js-ready");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: "0px 0px -2% 0px" });
    contentEls.forEach(function (el) { io.observe(el); });

    // Safety net: a fast fling, an odd viewport, or a quirky browser could
    // in principle skip an intersection callback. Real business content
    // must never stay stuck at opacity:0, so anything not yet revealed a
    // few seconds in gets shown outright.
    window.setTimeout(function () {
      contentEls.forEach(function (el) { el.classList.add("is-visible"); });
    }, 1200);
  }

  if (reduceMotion || typeof gsap === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  // Manual stroke draw-in for the drop outline (no DrawSVG plugin on the free CDN).
  var outline = document.querySelector(".drop-outline");
  var outlineLen = outline ? outline.getTotalLength() : 0;
  if (outline) {
    outline.style.strokeDasharray = outlineLen;
    outline.style.strokeDashoffset = outlineLen;
  }

  // Hero entrance: eyebrow, headline lines, copy/actions, then the drop + gauge device.
  // This runs on load, independent of scroll, so it always completes.
  var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
  heroTl
    .to(".hero .eyebrow[data-reveal]", { opacity: 1, y: 0, duration: .6 })
    .to(".hero-title .line", { opacity: 1, y: 0, duration: .8, stagger: .1 }, .1)
    .to(".hero-side [data-reveal]", { opacity: 1, y: 0, duration: .7, stagger: .1 }, .55)
    .fromTo(".drop-graphic",
      { opacity: 0, scale: .88, transformOrigin: "50% 30%" },
      { opacity: 1, scale: 1, duration: 1.1 }, .35)
    .to(outline, { strokeDashoffset: 0, duration: 1.3 }, .35)
    .fromTo(".gauge-graphic", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .7 }, .8)
    .fromTo(".device-tag", { opacity: 0 }, { opacity: 1, duration: .5 }, 1.1);
  heroEls.forEach(function (el) { el.classList.add("is-visible"); });

  // Signature moment: the gauge needle sweeps into the "ideal" zone as the
  // hero gives way to the services section, echoing an oil-pressure gauge
  // settling once the engine is running right. Purely decorative — if it
  // never fires, the needle simply stays put, nothing real is lost.
  gsap.to(".gauge-needle", {
    rotate: 40,
    transformOrigin: "100px 120px",
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: .6
    }
  });
})();
