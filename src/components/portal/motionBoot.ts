// Marks <html> before first paint so [data-reveal] starts hidden only when JS runs;
// if the observer never boots (JS error), everything is shown again after 3s.
export const MOTION_BOOT = `(function(){var d=document.documentElement;d.classList.add('pi-js');setTimeout(function(){if(!window.__piMotion)d.classList.remove('pi-js')},3000)})();`;
