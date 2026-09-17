/* ============================================================
   PallettAi — the free website checker (client)
   Extracted from terminal.js so a page can run the real checker
   without loading the old nav/footer bundle. Behaviour is
   unchanged: same worker, same endpoints, same report shape.

   Markup contract (all optional except #check-form):
     #check-form, #check-url, #check-rival, #vs-toggle, #vs-field
     #check-status, #check-out, #check-compare, #check-tools
     report:  #g-host #g-score #g-band #g-bars #g-finds
     compare: #vs-host-a/b #vs-score-a/b #vs-col-a/b #vs-verdict #vs-gaps
     print:   #ps-host #ps-score #ps-date   + body.printing-report
     actions: #tool-copy  #tool-print
     handoff: #check-next #next-head #next-body #next-copy #next-dl

   Deep link:  ?check=example.co.uk&vs=rival.co.uk#check
   ============================================================ */

(function () {
  'use strict';

  var GRADER = 'https://pallettai-grader.coreypallett20.workers.dev';
  var doc = document;

  /* ---------- helpers ---------- */

  function ping(name) {
    try {
      if (window.goatcounter && typeof window.goatcounter.count === 'function') {
        window.goatcounter.count({ path: name, title: name, event: true });
      }
    } catch (e) {}
  }

  function rank(got, max) { var p = max ? got / max : 1; return p >= 0.85 ? '' : p >= 0.5 ? 'warn' : 'fail'; }

  /* ---------- what a rebuild genuinely changes ----------

     The handoff makes a claim about PallettAI Studio's export, so the claim
     is written down here once, as two lists of check ids, where it can be
     read and argued with rather than being scattered through a sentence.

     REBUILD — checks an exported page writes for you, unconditionally:
     a <title> and meta description, a mobile viewport, a single <h1> (every
     template opens with a hero), and JSON-LD built from the business
     details. Those five are read off builder.js rather than assumed.

     HOST — checks no export can answer for you, because they are properties
     of where the site is served from rather than of the page itself.

     Deliberately absent, each for a reason:
       og      — Studio defaults the share image to an SVG, which X and
                 WhatsApp ignore. Rebuilding does not fix that.
       imgdims — the builder sizes images in CSS (aspect-ratio) rather than
                 with width/height attributes, which is what this check
                 reads. Rebuilding does not fix that either.
       canonical — only emitted when the project has a domain set, which the
                 rebuild flow asks for but cannot require.
       payload — depends on how much content the site carries, so it is a
                 property of the site rather than of the builder.
     Because 'og' and 'imgdims' are reported by this same page, promising
     them would be a claim the reader can disprove in one click. They are
     named in the copy below instead, as what to verify afterwards. */
  var REBUILD = { title: 1, description: 1, viewport: 1, h1: 1, jsonld: 1 };
  var HOST = { https: 1, forms: 1, ttfb: 1, compression: 1 };

  function names(checks, list) {
    var out = [];
    for (var i = 0; i < (checks || []).length; i++) {
      var c = checks[i];
      if (c && c.status && c.status !== 'pass' && c.id && list[c.id]) out.push(String(c.label || c.id).toLowerCase());
    }
    return out;
  }

  /* "a, b and c" — an Oxford-comma-free British list, to match the site. */
  function sentence(list) {
    if (!list.length) return '';
    if (list.length === 1) return list[0];
    return list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1];
  }

  function normalize(raw) {
    var v = (raw || '').trim();
    if (!v) return null;
    var u;
    try { u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : 'https://' + v); } catch (e) { return null; }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (!u.hostname || u.hostname.indexOf('.') === -1) return null;
    return u;
  }

  function grade(href) {
    return fetch(GRADER + '/grade?url=' + encodeURIComponent(href)).then(function (r) {
      return r.text().then(function (t) {
        var j = null;
        try { j = JSON.parse(t); } catch (e) {}
        if (!r.ok || !j) throw new Error((j && j.error) || 'that address could not be read');
        return j;
      });
    });
  }

  /* ---------- report rendering ---------- */

  function renderBars(host, cats) {
    host.innerHTML = '';
    Object.keys(cats || {}).forEach(function (name) {
      var c = cats[name];
      var el = doc.createElement('div');
      el.className = 'bar ' + rank(c.got, c.max);
      el.innerHTML = '<div class="t"><span></span><span></span></div><div class="track"><div class="fill"></div></div>';
      el.querySelector('.t span:first-child').textContent = name;
      el.querySelector('.t span:last-child').textContent = c.got + '/' + c.max;
      host.appendChild(el);
      var pct = c.max ? Math.round((c.got / c.max) * 100) : 0;
      requestAnimationFrame(function () { el.querySelector('.fill').style.width = pct + '%'; });
    });
  }

  function renderFinds(host, checks) {
    host.innerHTML = '';
    (checks || []).forEach(function (c) {
      var li = doc.createElement('li');
      li.className = c.status === 'pass' ? '' : c.status;
      var mark = doc.createElement('span');
      mark.className = 'm';
      mark.textContent = c.status === 'pass' ? '✓' : c.status === 'warn' ? '!' : '✕';
      var body = doc.createElement('div');
      var label = doc.createElement('b');
      label.textContent = c.label;
      body.appendChild(label);
      body.appendChild(doc.createTextNode(c.detail || ''));
      if (c.fix) {
        var fix = doc.createElement('span');
        fix.className = 'fix';
        fix.textContent = 'Our fix: ' + c.fix;
        body.appendChild(fix);
      }
      li.appendChild(mark);
      li.appendChild(body);
      host.appendChild(li);
    });
  }

  /* ---------- the checker ---------- */

  function initChecker() {
    var form = doc.getElementById('check-form');
    if (!form) return;

    var input = doc.getElementById('check-url');
    var rival = doc.getElementById('check-rival');
    var status = doc.getElementById('check-status');
    var out = doc.getElementById('check-out');
    var compare = doc.getElementById('check-compare');
    var tools = doc.getElementById('check-tools');
    var vsToggle = doc.getElementById('vs-toggle');
    var vsField = doc.getElementById('vs-field');
    var last = { a: null, b: null };

    if (vsToggle) {
      vsToggle.addEventListener('click', function () {
        var open = vsToggle.getAttribute('aria-expanded') === 'true';
        vsToggle.setAttribute('aria-expanded', String(!open));
        vsField.hidden = open;
        if (!open && rival) rival.focus();
      });
    }

    function showOwn(host, j) {
      doc.getElementById('g-host').textContent = host;
      doc.getElementById('g-score').textContent = j.score;
      doc.getElementById('g-band').textContent = j.band || '';
      renderBars(doc.getElementById('g-bars'), j.categories);
      renderFinds(doc.getElementById('g-finds'), j.checks);
      out.hidden = false;
      if (tools) tools.hidden = false;
      showNext(host, j);
    }

    /* ---------- the handoff ----------

       The report is the only place on the site where a visitor has just been
       told, in specific terms, what is wrong with their website. That is the
       highest-intent moment we get, and it used to end at a PDF button.

       What this must NOT do is claim a rebuild fixes everything above it —
       half of what the grader finds is a hosting property, and anyone can
       re-run the check after rebuilding and see for themselves. So it splits
       the findings: the ones an export starts clean on, the ones only the
       host can answer for, and the two this page reports that an export can
       still trip on. Naming that last group costs a little polish and buys
       the whole block its credibility. */
    function showNext(host, j) {
      var box = doc.getElementById('check-next');
      if (!box) return;

      var clears = names(j.checks, REBUILD);
      var hosted = names(j.checks, HOST);
      var head = doc.getElementById('next-head');
      var body = doc.getElementById('next-body');

      if (head) {
        head.textContent = j.score >= 85
          ? 'Sites built in Studio score well here.'
          : 'Rebuild this site in Studio.';
      }

      if (body) {
        var lines = [];
        lines.push(clears.length
          ? 'Of what this report flagged, a rebuild starts clean on ' + sentence(clears) + '.'
          : 'Nothing this report flagged sits in the part a rebuild handles — that half is already right.');

        if (hosted.length) {
          lines.push('The rest is your hosting, not your page — ' + sentence(hosted) + '. No tool can fix those for you; who serves the site decides them.');
        }

        lines.push('Two things to re-check after any rebuild: the share image (Studio defaults it to an SVG, which X and WhatsApp ignore) and image dimensions. Both are scored above, and both are fixable in the app.');

        body.textContent = lines.join(' ');
      }

      /* The address travels in the link, not in the app — a URL survives the
         hop from the phone this check was run on to the Mac it will be
         rebuilt on, and it survives it today. A bare "pre-filled" promise
         would need an app release with a registered URL scheme. */
      var dl = doc.getElementById('next-dl');
      if (dl) {
        dl.setAttribute('href', 'downloads.html?utm_source=grader&utm_medium=checker&utm_campaign=site-check' +
          '&rebuild=' + encodeURIComponent(host) + '&score=' + encodeURIComponent(j.score) + '#from-checker');
        dl.addEventListener('click', function () { ping('/event/grader-to-studio'); });
      }

      var copy = doc.getElementById('next-copy');
      var copyHost = doc.getElementById('next-copy-host');
      if (copyHost) copyHost.textContent = host;
      if (copy) {
        copy.setAttribute('data-host', host);
        copy.addEventListener('click', function () { ping('/event/grader-copy-address'); });
      }

      box.hidden = false;
    }

    function showCompare(a, ja, b, jb) {
      doc.getElementById('vs-host-a').textContent = a;
      doc.getElementById('vs-host-b').textContent = b;
      doc.getElementById('vs-score-a').textContent = ja.score;
      doc.getElementById('vs-score-b').textContent = jb.score;
      doc.getElementById('vs-col-a').className = 'vs-col' + (ja.score >= jb.score ? ' win' : '');
      doc.getElementById('vs-col-b').className = 'vs-col' + (jb.score > ja.score ? ' win' : '');

      var verdict = doc.getElementById('vs-verdict');
      var d = ja.score - jb.score;
      if (d > 0) verdict.textContent = a + ' is ahead by ' + d + ' points. Worth protecting that lead.';
      else if (d < 0) verdict.textContent = b + ' is ahead by ' + Math.abs(d) + ' points. Here is exactly where you are losing ground.';
      else verdict.textContent = 'Dead level at ' + ja.score + '/100. The next fix decides it.';

      /* only list categories where the rival genuinely does better */
      var gaps = [];
      Object.keys(ja.categories || {}).forEach(function (name) {
        var mine = ja.categories[name], theirs = (jb.categories || {})[name];
        if (theirs && theirs.got > mine.got) {
          gaps.push(name + ' — they score ' + theirs.got + '/' + theirs.max + ', you score ' + mine.got + '/' + mine.max);
        }
      });
      var gapHost = doc.getElementById('vs-gaps');
      if (gaps.length) {
        gapHost.innerHTML = '<h4>Where they beat you</h4><ul></ul>';
        var ul = gapHost.querySelector('ul');
        gaps.forEach(function (g) {
          var li = doc.createElement('li');
          li.textContent = g;
          ul.appendChild(li);
        });
      } else {
        gapHost.innerHTML = '<h4>Where they beat you</h4><p class="status ok">Nowhere — you match or beat them in every category.</p>';
      }
      compare.hidden = false;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var target = normalize(input.value);
      if (!target) {
        status.className = 'status err';
        status.textContent = '> that does not look like a web address — try yourbusiness.co.uk';
        return;
      }
      var other = (rival && !vsField.hidden) ? normalize(rival.value) : null;

      out.hidden = true;
      compare.hidden = true;
      if (tools) tools.hidden = true;
      var nextBox = doc.getElementById('check-next');
      if (nextBox) nextBox.hidden = true;
      status.className = 'status';
      status.textContent = other
        ? '> measuring ' + target.hostname + ' against ' + other.hostname + '…'
        : '> measuring ' + target.hostname + '…';

      var btn = form.querySelector('button[type=submit]');
      if (btn) btn.disabled = true;
      var jobs = other ? [grade(target.href), grade(other.href)] : [grade(target.href)];
      Promise.all(jobs).then(function (res) {
        last.a = { host: target.hostname, data: res[0] };
        last.b = null;
        showOwn(target.hostname, res[0]);
        if (other && res[1]) {
          last.b = { host: other.hostname, data: res[1] };
          showCompare(target.hostname, res[0], other.hostname, res[1]);
          status.textContent = '> ' + target.hostname + ' ' + res[0].score + '/100 · ' + other.hostname + ' ' + res[1].score + '/100';
        } else {
          status.textContent = '> ' + target.hostname + ' rated ' + res[0].score + '/100';
        }
        ping(other ? '/event/grader-compare' : '/event/grader');
      }).catch(function (err) {
        status.className = 'status err';
        status.textContent = '> ' + (err.message || 'the checker is busy — try again shortly');
      }).finally(function () {
        if (btn) btn.disabled = false;
      });
    });

    var copy = doc.getElementById('tool-copy');
    if (copy) {
      copy.addEventListener('click', function () {
        if (!last.a) return;
        var url = location.origin + location.pathname + '?check=' + encodeURIComponent(last.a.host) +
          (last.b ? '&vs=' + encodeURIComponent(last.b.host) : '') + '#check';
        var done = function (ok) {
          copy.textContent = ok ? 'Link copied' : 'Copy failed — select the address bar';
          setTimeout(function () { copy.textContent = 'Copy report link'; }, 1800);
        };
        function fallback() {
          var ta = doc.createElement('textarea');
          ta.value = url;
          ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:fixed;left:-9999px;top:0';
          doc.body.appendChild(ta);
          ta.select();
          var ok = false;
          try { ok = doc.execCommand('copy'); } catch (err) { ok = false; }
          doc.body.removeChild(ta);
          done(ok);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () { done(true); }, fallback);
        } else fallback();
      });
    }

    /* Copy the graded address, not the report link — the thing the visitor
       actually needs on the next screen is the address, because the next
       screen is a desktop app on a different machine. Falls back to a
       selection when the clipboard is unavailable or denied (the same
       fallback the report-link button uses, minus the toast). */
    var addressBtn = doc.getElementById('next-copy');
    if (addressBtn) {
      addressBtn.addEventListener('click', function () {
        var host = addressBtn.getAttribute('data-host') || '';
        if (!host) return;
        /* Rebuilt as nodes rather than innerHTML: the address comes from
           the visitor, and a copy button is not the place to find out
           whether a hostname can carry markup. */
        function relabel() {
          addressBtn.textContent = '';
          addressBtn.appendChild(doc.createTextNode('Copy '));
          var b = doc.createElement('span');
          b.textContent = host;
          addressBtn.appendChild(b);
        }
        function done(ok) {
          addressBtn.textContent = ok ? 'Copied — paste it into Studio' : 'Select the address above';
          setTimeout(relabel, 2200);
        }
        function fallback() {
          var ta = doc.createElement('textarea');
          ta.value = host;
          ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:fixed;left:-9999px;top:0';
          doc.body.appendChild(ta);
          ta.select();
          var ok = false;
          try { ok = doc.execCommand('copy'); } catch (err) { ok = false; }
          doc.body.removeChild(ta);
          done(ok);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(host).then(function () { done(true); }, fallback);
        } else fallback();
      });
    }

    var print = doc.getElementById('tool-print');
    if (print) {
      print.addEventListener('click', function () {
        var host = doc.getElementById('ps-host');
        var score = doc.getElementById('ps-score');
        var date = doc.getElementById('ps-date');
        if (host) host.textContent = (last.a && last.a.host) || input.value || '—';
        if (score) {
          score.textContent = last.a
            ? last.a.data.score + '/100' + (last.b ? '  vs  ' + last.b.host + ' ' + last.b.data.score + '/100' : '')
            : '—';
        }
        if (date) {
          date.textContent = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
        }
        doc.body.classList.add('printing-report');
        var done = function () { doc.body.classList.remove('printing-report'); };
        if ('onafterprint' in window) window.addEventListener('afterprint', done, { once: true });
        else setTimeout(done, 800);
        window.print();
      });
    }

    /* deep link: ?check=host&vs=host runs the report on arrival */
    var q = new URLSearchParams(location.search);
    if (q.get('check')) {
      input.value = q.get('check');
      if (q.get('vs') && rival) {
        rival.value = q.get('vs');
        vsField.hidden = false;
        if (vsToggle) vsToggle.setAttribute('aria-expanded', 'true');
      }
      if (typeof form.requestSubmit === 'function') form.requestSubmit();
      else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', initChecker);
  else initChecker();
})();
