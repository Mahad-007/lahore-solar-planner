export const THEME_STORAGE_KEY = "sunplan:theme";

/**
 * Runs in <head> before first paint: applies the saved theme, or the system theme when
 * none is saved, and keeps following the system until the person picks one.
 */
export const THEME_SCRIPT = `(function(){
  var root = document.documentElement;
  var media = window.matchMedia("(prefers-color-scheme: dark)");
  var saved = function () {
    try { var t = localStorage.getItem("${THEME_STORAGE_KEY}"); return t === "light" || t === "dark" ? t : null; }
    catch (e) { return null; }
  };
  root.dataset.theme = saved() || (media.matches ? "dark" : "light");
  media.addEventListener("change", function (e) {
    if (!saved()) root.dataset.theme = e.matches ? "dark" : "light";
  });
})();`;
