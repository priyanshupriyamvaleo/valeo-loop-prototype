/* ============================================================
   VALEO PROTOTYPE — EMBED BRIDGE
   Loaded by every screen file. Completely inert when the screen
   is opened directly; activates only inside the prototype shell.

   Responsibilities:
   1. Strip presentation chrome (frame label, caption, page padding)
      so the screen fills a clean 390x844 iframe.
   2. Support ?frame=N  — files containing several .frame-col blocks
      (C1, P1) expose each frame as its own prototype node.
   3. Support ?card=N   — P6's four inconclusive variants, each as
      its own node.
   4. Report clicks to the shell via postMessage. The screen never
      knows where it is in the flow — all routing lives in the shell.
   ============================================================ */
(function () {
  if (window.parent === window) return;   // opened directly → do nothing

  var d = document, root = d.documentElement;
  root.classList.add('valeo-embed');

  var params   = new URLSearchParams(location.search);
  var frameIdx = parseInt(params.get('frame'), 10);
  var cardIdx  = parseInt(params.get('card'), 10);

  /* ?fluid=1 — mobile review mode. The screens are authored at a fixed
     390x844; on a real handset that either clips (narrow) or letterboxes
     (wide). Fluid mode lets them fill the actual viewport instead. */
  var fluid = params.has('fluid');
  var W = fluid ? '100%'  : '390px';
  var H = fluid ? '100dvh' : '844px';

  var style = d.createElement('style');
  style.textContent = [
    'html.valeo-embed,html.valeo-embed body{margin:0!important;padding:0!important;',
      'display:block!important;width:' + W + ';height:' + H + ';overflow:hidden;',
      'background:var(--surface-app,#FFFDF5)!important;}',
    'html.valeo-embed .frame-label,html.valeo-embed .caption,html.valeo-embed .caption-strip,',
      'html.valeo-embed .page-title,html.valeo-embed .page-sub{display:none!important;}',
    'html.valeo-embed .frame-col{display:block!important;align-items:initial!important;}',
    'html.valeo-embed .device,html.valeo-embed .lockscreen{',
      'border-radius:0!important;box-shadow:none!important;',
      'width:' + W + '!important;height:' + H + '!important;}',
    fluid ? 'html.valeo-embed .device__notch{display:none!important}' : '',
    fluid ? 'html.valeo-embed .screen{width:100%!important;max-width:none!important}' : '',
    fluid ? 'html.valeo-embed .home-indicator{display:none!important}' : '',
    /* P6 single-card mode */
    'html.valeo-embed.single-card body{padding:22px 18px!important;height:844px;}',
    'html.valeo-embed.single-card .grid{display:block!important;max-width:none!important;}',
    'html.valeo-embed.single-card .mini-device{width:354px!important;box-shadow:none!important;',
      'border:1px solid rgba(27,57,91,.12)!important;}'
  ].join('');
  d.head.appendChild(style);

  function post(msg) { msg.source = 'valeo-screen'; parent.postMessage(msg, '*'); }

  /* Anything a finger would plausibly land on. Bare background taps are ignored
     so the demo never advances by accident.

     NOTE: this list is the known weakness of the bridge — a new component class
     silently becomes unclickable. Screens with persistent chrome are now native
     React components in app.html and do not rely on this at all; only the
     self-contained linear-flow documents still route through here. */
  var TAPPABLE = [
    '.btn', '[data-nav]', 'a', '.notif',
    /* back + tabs, both vocabularies */
    '.nav-bar__back', '.appbar__back', '.tab-bar__item', '.tabs3__i',
    /* v1 component vocabulary */
    '.opt-row', '.goal-card', '.who-opt', '.resp-btn', '.slot-row', '.day-chip',
    '.reason-remedy', '.option-row', '.expand-row', '.rail-chip', '.chip',
    '.severity-scale__seg', '.protocol-item', '.impact-card', '.marker-row',
    '.hero-marker', '.state-thumb', '.sealed-card', '.plan-row', '.fact-row',
    '.status-item', '.filter-tab', '.pattern-link', '.extraction-card',
    '.escalation-card', '.finish-card', '.appt-card', '.clin-card',
    '.panel-card', '.history-card', '.locked-row', '.care-row', '.alt-card',
    '.next-loop', '.next-hypo', '.amend-card', '.gate-card', '.composer',
    /* v2 vocabulary introduced with the Loop Ring redesign */
    '.entry', '.entry__cta', '.svc', '.act', '.proto__i', '.sys', '.contract',
    '.rec', '.gate', '.evid__c', '.wrow', '.claim', '.qrow', '.surface',
    '.pk', '.insight', '.searchbar', '.appbar__avatar', '.appbar__ring', '.ring'
  ].join(',');

  function boot() {
    if (frameIdx) {
      var cols = d.querySelectorAll('body > .frame-col');
      for (var i = 0; i < cols.length; i++)
        if (i !== frameIdx - 1) cols[i].style.display = 'none';
    }
    if (cardIdx) {
      root.classList.add('single-card');
      var cards = d.querySelectorAll('.mini-device');
      for (var j = 0; j < cards.length; j++)
        if (j !== cardIdx - 1) cards[j].style.display = 'none';
    }

    d.addEventListener('click', function (e) {
      if (!e.target || !e.target.closest) return;
      var t = e.target.closest(TAPPABLE);
      if (!t) return;                        // background tap → ignore
      e.preventDefault(); e.stopPropagation();

      if (t.dataset && t.dataset.nav)            return post({ type: 'nav', to: t.dataset.nav });
      if (t.classList.contains('nav-bar__back'))  return post({ type: 'back' });
      if (t.classList.contains('tab-bar__item')) {
        var items = [].slice.call(d.querySelectorAll('.tab-bar__item'));
        return post({ type: 'tab', index: items.indexOf(t) });
      }
      if (t.classList.contains('btn--secondary') ||
          t.classList.contains('btn--ghost'))     return post({ type: 'secondary' });
      return post({ type: 'primary' });
    }, true);

    post({ type: 'ready' });
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
