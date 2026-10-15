/* DAYSTRIKE waitlist site */

/* ============================================================
   KLAVIYO SETUP: fill in these two values before going live.
   1. KLAVIYO_PUBLIC_KEY: your 6-character Public API Key / Site ID
      (Klaviyo > Settings > API Keys > Public API Key).
   2. KLAVIYO_LIST_ID: the ID of the list "DAYSTRIKE Waitlist"
      (Klaviyo > Audience > Lists & Segments > DAYSTRIKE Waitlist >
      Settings > List ID).
   The public key is safe to use in the browser. Never put a
   PRIVATE API key in this file.
   ============================================================ */
const KLAVIYO_PUBLIC_KEY = 'YOUR_KLAVIYO_PUBLIC_KEY'; // <-- REPLACE
const KLAVIYO_LIST_ID = 'YOUR_KLAVIYO_LIST_ID';       // <-- REPLACE
const KLAVIYO_REVISION = '2026-10-15';

(function () {
  const configured = !KLAVIYO_PUBLIC_KEY.startsWith('YOUR_') && !KLAVIYO_LIST_ID.startsWith('YOUR_');

  /* Header background on scroll */
  const header = document.querySelector('[data-header]');
  const onScroll = () => header.classList.toggle('header--scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Reveal on scroll */
  const targets = document.querySelectorAll('.section__head, .who__grid > *, .swap, .formula__grid > *, .flavor, .waitlist__inner > *, .faq__inner > *');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach((el) => el.classList.add('reveal'));
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    targets.forEach((el) => io.observe(el));
  }

  /* Waitlist forms -> Klaviyo list "DAYSTRIKE Waitlist" */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  async function subscribe({ email, firstName, flavor, source }) {
    const profile = { email, properties: { waitlist_source: source } };
    if (firstName) profile.first_name = firstName;
    if (flavor) profile.properties.flavor_interest = flavor;
    profile.subscriptions = { email: { marketing: { consent: 'SUBSCRIBED' } } };

    const res = await fetch(`https://a.klaviyo.com/client/subscriptions?company_id=${encodeURIComponent(KLAVIYO_PUBLIC_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/vnd.api+json', revision: KLAVIYO_REVISION },
      body: JSON.stringify({
        data: {
          type: 'subscription',
          attributes: {
            custom_source: 'drinkdaystrike.com waitlist',
            profile: { data: { type: 'profile', attributes: profile } }
          },
          relationships: { list: { data: { type: 'list', id: KLAVIYO_LIST_ID } } }
        }
      })
    });
    if (!res.ok && res.status !== 202) throw new Error('Klaviyo ' + res.status);
  }

  document.querySelectorAll('[data-waitlist]').forEach((form) => {
    const msg = form.querySelector('[data-msg]');
    const btn = form.querySelector('[data-submit]');
    const say = (text, ok) => { msg.textContent = text; msg.className = 'form__msg ' + (ok ? 'is-ok' : 'is-err'); };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      if (fd.get('company')) return; // spam trap
      const email = String(fd.get('email') || '').trim();
      if (!EMAIL_RE.test(email)) return say('Enter a valid email address.', false);
      const age = form.querySelector('input[name="age"]');
      if (age && !age.checked) return say('Please confirm you are 18 or older.', false);
      if (!configured) {
        console.warn('DAYSTRIKE: add KLAVIYO_PUBLIC_KEY and KLAVIYO_LIST_ID in script.js to connect the waitlist.');
        return say('The waitlist is almost ready. Please check back soon.', false);
      }
      btn.disabled = true;
      const label = btn.textContent;
      btn.textContent = 'Joining...';
      try {
        await subscribe({
          email,
          firstName: String(fd.get('first_name') || '').trim(),
          flavor: fd.get('flavor') ? String(fd.get('flavor')) : '',
          source: form.dataset.source || 'site'
        });
        form.reset();
        say("You're on the list. Watch your inbox.", true);
      } catch (err) {
        console.error(err);
        say('Something went wrong. Please try again in a minute.', false);
      } finally {
        btn.disabled = false;
        btn.textContent = label;
      }
    });
  });
})();
