// The part that receives signups. The design (index.html) can be replaced freely, as long as the new page keeps:
// step 1: <form id="waitlist-form"> with inputs named email, phone, website (the hidden trap)
// step 2: <form id="waitlist-more"> with inputs named name, other, instagram, buttons [data-occupation] (pick one),
//         [data-interest] (pick several) and a [data-skip] button
// messages: #waitlist-msg; screens: #waitlist-step2 (after signup) and #waitlist-done (at the end);
// optional: a [data-name-comma] span (becomes ", <first name>"), a [data-share] button.
// Why the name is on the thank-you screen: research/synthesis.md (a name field at signup costs signups).
(function () {
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbx_gNwmj5o5pcrvhxLsr0GXVW-msMN80HRkH5gUNlsTFI9nE2x19foUuZWmScqQVHtD/exec';

  // The source comes from the link (?src=blender). Any word works, so new and old guides need no change here.
  var raw = new URLSearchParams(location.search).get('src') || 'ישיר';
  var src = raw.replace(/[^\w֐-׿-]/g, '').slice(0, 40) || 'ישיר';

  var form = document.getElementById('waitlist-form');
  var more = document.getElementById('waitlist-more');
  var step2 = document.getElementById('waitlist-step2');
  var done = document.getElementById('waitlist-done');
  var msg = document.getElementById('waitlist-msg');
  var rowId = null;

  function say(text) { msg.textContent = text; msg.hidden = !text; }
  function show(el) { [form, step2, done].forEach(function (x) { if (x) x.hidden = x !== el; }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function post(fields) {
    return fetch(ENDPOINT, { method: 'POST', body: new URLSearchParams(fields) })
      .then(function (r) { return r.json(); })
      .then(function (res) { if (!res.ok) throw new Error(res.error || 'failed'); return res; });
  }
  function busy(button, on) {
    button.dataset.label = button.dataset.label || button.textContent;
    button.disabled = on;
    button.textContent = on ? 'שולח...' : button.dataset.label;
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    // form.elements, because form.name would be the form's own name attribute, not an input
    var f = form.elements;
    var email = f['email'].value.trim();
    var phone = f['phone'].value.trim();
    var digits = phone.replace(/\D/g, '');

    if (!email && !phone) return say('צריך מייל או טלפון, לפחות אחד מהם.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return say('המייל לא נראה תקין. כדאי לבדוק אותו שוב.');
    if (phone && (digits.length < 9 || digits.length > 15)) return say('הטלפון לא נראה תקין. כדאי לבדוק אותו שוב.');

    say('');
    var button = form.querySelector('button[type="submit"]');
    busy(button, true);
    post({ email: email, phone: phone, website: f['website'].value, src: src })
      .then(function (res) { rowId = res.id; show(more ? step2 : done); })
      .catch(function () { say('משהו נתקע בשליחה. אפשר לנסות שוב בעוד רגע.'); busy(button, false); });
  });

  if (more) {
    more.addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-occupation')) {
        more.querySelectorAll('[data-occupation]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      } else if (b.hasAttribute('data-interest')) {
        b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      } else if (b.hasAttribute('data-skip')) {
        show(done);
      }
    });

    more.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var m = more.elements;
      var pick = function (sel) {
        return Array.prototype.map.call(more.querySelectorAll(sel + '[aria-pressed="true"]'), function (x) { return x.textContent.trim(); });
      };
      var name = m['name'].value.trim();
      var interests = pick('[data-interest]');
      var other = m['other'].value.trim();
      if (other) interests.push('אחר: ' + other);
      var fields = { step: '2', id: rowId || '', name: name, occupation: pick('[data-occupation]').join(''), interests: interests.join(' | '), instagram: m['instagram'].value.trim() };

      if (name) document.querySelectorAll('[data-name-comma]').forEach(function (el) { el.textContent = ', ' + name.split(' ')[0]; });
      // Nothing filled in, or no row to attach to: just move on.
      if (!rowId || (!fields.name && !fields.occupation && !fields.interests && !fields.instagram)) return show(done);
      var button = more.querySelector('button[type="submit"]');
      busy(button, true);
      // The signup is already saved, so a failure here never blocks the person.
      post(fields).catch(function () {}).then(function () { show(done); });
    });
  }

  document.querySelectorAll('[data-share]').forEach(function (b) {
    b.addEventListener('click', function () {
      var url = location.origin + location.pathname + '?src=share';
      var data = { title: document.title, text: 'מצאתי משהו שיכול לעניין אותך', url: url };
      if (navigator.share) return navigator.share(data).catch(function () {});
      navigator.clipboard.writeText(url).then(function () { b.textContent = 'הקישור הועתק ✓'; });
    });
  });
})();
