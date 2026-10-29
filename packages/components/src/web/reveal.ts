/**
 * Scroll reveal for `theme.motion.reveal`: the content blocks of every section after the hero fade in and rise
 * as they enter the viewport (CSS in global.css, "site-chrome").
 *
 * Content never depends on this script: blocks are hidden only after it has tagged them and marked the document
 * ready (<html data-reveal-ready>). Without JavaScript, without IntersectionObserver, or under
 * prefers-reduced-motion it does nothing, so everything is shown at once.
 */
export function revealOnScroll(): void {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // The blocks are the direct children of each section's content container (see ui/Section.astro).
  const blocks = document.querySelectorAll<HTMLElement>('main [data-section]:not([data-section="hero"]) > div > *');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute('data-revealed', '');
        observer.unobserve(entry.target);
      }
    },
    // Any pixel past the bottom 10% of the viewport counts, so blocks taller than the screen still reveal.
    { rootMargin: '0px 0px -10% 0px' },
  );
  for (const block of blocks) {
    block.setAttribute('data-reveal', '');
    observer.observe(block);
  }
  document.documentElement.setAttribute('data-reveal-ready', '');
}

revealOnScroll();
