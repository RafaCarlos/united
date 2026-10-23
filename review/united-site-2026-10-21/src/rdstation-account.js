(function () {
  'use strict';
  // These are the account loader and Tag Manager container used by the current
  // public site. Local/staging previews must not create marketing visits.
  if (window.UnitedMarketingAccount) return;
  window.UnitedMarketingAccount = true;
  if (!/^(www\.)?unitedidiomas\.com$/i.test(window.location.hostname)) return;
  const robots = document.querySelector('meta[name="robots"]');
  if (robots && /\bnoindex\b/i.test(robots.content)) return;

  const RD_URL = 'https://d335luupugsy2.cloudfront.net/js/loader-scripts/ee4f0815-8266-4fb5-ba25-416836b02312-loader.js';
  const GTM_ID = 'GTM-MTK74PV';

  function hasScript(url, parameter) {
    const wanted = new URL(url);
    return Array.from(document.scripts).some(function (script) {
      if (!script.src) return false;
      const actual = new URL(script.src, document.baseURI);
      return actual.hostname === wanted.hostname && actual.pathname === wanted.pathname &&
        (!parameter || actual.searchParams.get(parameter) === wanted.searchParams.get(parameter));
    });
  }

  function appendScript(id, url) {
    const script = document.createElement('script');
    script.id = id;
    script.async = true;
    script.src = url;
    document.head.appendChild(script);
  }

  if (!hasScript(RD_URL)) appendScript('united-rd-account', RD_URL);
  const gtmURL = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
  if (!hasScript(gtmURL, 'id') && !(window.google_tag_manager && window.google_tag_manager[GTM_ID])) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({'gtm.start': Date.now(), event: 'gtm.js'});
    appendScript('united-existing-gtm', gtmURL);
  }
  // RD's own scripts still handle attribution, consent and conversions. Do not
  // send a second conversion or recreate individual tags managed by the agency.
}());
