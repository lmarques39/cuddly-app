/*
 * Testers' feedback form (#132), shared by feedback.html and en/feedback.html.
 * Writes one document to Firestore's feedback collection through the REST
 * API — no Firebase SDK needed for a single write. The key is the app's
 * public Firebase web key: it identifies the project, it doesn't grant
 * access. What the form may write is enforced by firestore.rules (create
 * only, fixed fields and sizes, no reads); the answers are read in the
 * Firebase console.
 */
(function () {
  var ENDPOINT =
    'https://firestore.googleapis.com/v1/projects/cuddly-app-9b0f7/databases/(default)/documents/feedback?key=AIzaSyA1-ZnERg61RD7lXV5qsewnQFowfYjgL14';
  var lang = document.documentElement.lang === 'en' ? 'en' : 'pt';
  var TEXT = {
    pt: {
      sending: 'A enviar…',
      sent: 'Obrigado! O teu feedback foi enviado.',
      tooShort: 'Escreve pelo menos algumas palavras sobre o que aconteceu.',
      failed: 'Não foi possível enviar agora. Tenta outra vez daqui a pouco ou escreve para lfrm39@gmail.com.',
    },
    en: {
      sending: 'Sending…',
      sent: 'Thank you! Your feedback was sent.',
      tooShort: 'Please write at least a few words about what happened.',
      failed: "Couldn't send it right now. Try again in a moment or write to lfrm39@gmail.com.",
    },
  }[lang];

  var form = document.getElementById('feedback-form');
  var status = document.getElementById('feedback-status');
  var button = form.querySelector('button[type="submit"]');

  // A link from the app can fill in its version: feedback.html?v=2.0.1
  var version = new URLSearchParams(location.search).get('v');
  if (version) form.elements.appVersion.value = version.slice(0, 40);

  function show(message, kind) {
    status.textContent = message;
    status.className = 'form-status ' + kind;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var data = new FormData(form);

    // Bots fill every field, people never see this one — pretend it worked.
    if (data.get('website')) {
      form.reset();
      show(TEXT.sent, 'ok');
      return;
    }

    var message = String(data.get('message') || '').trim();
    if (message.length < 5) {
      show(TEXT.tooShort, 'error');
      form.elements.message.focus();
      return;
    }

    var fields = {
      kind: { stringValue: String(data.get('kind')) },
      message: { stringValue: message.slice(0, 4000) },
      lang: { stringValue: lang },
      createdAt: { timestampValue: new Date().toISOString() },
    };
    [['area', 100], ['appVersion', 40], ['device', 100], ['contact', 200]].forEach(function (pair) {
      var value = String(data.get(pair[0]) || '').trim();
      if (value) fields[pair[0]] = { stringValue: value.slice(0, pair[1]) };
    });

    button.disabled = true;
    show(TEXT.sending, 'pending');
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: fields }) })
      .then(function (response) {
        if (!response.ok) throw new Error(String(response.status));
        form.reset();
        show(TEXT.sent, 'ok');
      })
      .catch(function () {
        show(TEXT.failed, 'error');
      })
      .finally(function () {
        button.disabled = false;
      });
  });
})();
