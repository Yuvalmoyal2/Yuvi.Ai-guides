// The part that receives signups. The design (index.html) can be replaced freely, as long as the new page keeps:
// a <form id="waitlist-form"> with inputs named email, phone, instagram, website (the hidden trap),
// an element #waitlist-msg for messages, and an element #waitlist-done shown after success.
(function () {
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbx_gNwmj5o5pcrvhxLsr0GXVW-msMN80HRkH5gUNlsTFI9nE2x19foUuZWmScqQVHtD/exec';

  // The source comes from the link (?src=blender). Any word works, so new and old guides need no change here.
  var raw = new URLSearchParams(location.search).get('src') || 'ישיר';
  var src = raw.replace(/[^\w֐-׿-]/g, '').slice(0, 40) || 'ישיר';

  var form = document.getElementById('waitlist-form');
  var msg = document.getElementById('waitlist-msg');
  var done = document.getElementById('waitlist-done');
  var button = form.querySelector('button[type="submit"]');

  function say(text) { msg.textContent = text; msg.hidden = !text; }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var email = form.email.value.trim();
    var phone = form.phone.value.trim();

    if (!email && !phone) return say('צריך מייל או טלפון, לפחות אחד מהם.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return say('המייל לא נראה תקין. כדאי לבדוק אותו שוב.');
    var digits = phone.replace(/\D/g, '');
    if (phone && (digits.length < 9 || digits.length > 15)) return say('הטלפון לא נראה תקין. כדאי לבדוק אותו שוב.');

    say('');
    button.disabled = true;
    button.dataset.label = button.dataset.label || button.textContent;
    button.textContent = 'שולח...';

    var body = new URLSearchParams({
      email: email,
      phone: phone,
      instagram: form.instagram.value.trim(),
      website: form.website.value,
      src: src
    });

    fetch(ENDPOINT, { method: 'POST', body: body })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error || 'failed');
        form.hidden = true;
        done.hidden = false;
      })
      .catch(function () {
        say('משהו נתקע בשליחה. אפשר לנסות שוב בעוד רגע.');
        button.disabled = false;
        button.textContent = button.dataset.label;
      });
  });
})();
