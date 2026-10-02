/* PallettAI / restrained motion.
   The design is complete without animation. Shared functional behaviours
   (menu, billing, downloads and reels) remain in theme.js. No heading
   splitting, cursor trackers, magnetic controls or full-page canvas loops. */
(function () {
  'use strict';
  document.querySelectorAll('.rv, .up, [data-reveal]').forEach(function (el) {
    el.classList.add('in');
  });
})();
