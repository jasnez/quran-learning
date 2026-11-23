/**
 * Inline script injected into <head> by the root layout. It runs before React
 * hydrates and applies the persisted theme and Arabic font so there is no
 * flash of the default theme on full page loads.
 *
 * Kept in its own module so a test can parse and execute it.
 */
export const THEME_INIT_SCRIPT = `(function(){var k='quran-learning-settings';try{var s=localStorage.getItem(k);if(s){var d=JSON.parse(s);var st=(d&&d.state)||d;var t=st&&st.theme;var f=st&&st.arabicFontStyle;if(t)document.documentElement.setAttribute('data-theme',t);if(f)document.documentElement.setAttribute('data-arabic-font',f);if(st&&st.showTajwidColors!==false&&st.showTajwidLines===true)document.documentElement.setAttribute('data-tajwid-lines','');}}catch(e){}})();`;
