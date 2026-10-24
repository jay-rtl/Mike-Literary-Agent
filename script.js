(() => {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#primary-nav');
  document.documentElement.classList.add('js-nav');
  menuButton.hidden = false;
  function closeMenu(returnFocus = false) {
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => {
    const open = navigation.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  navigation.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    closeMenu();
    const destination = document.querySelector(link.getAttribute('href'));
    if (destination) {
      destination.tabIndex = -1;
      destination.focus({ preventScroll: true });
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navigation.classList.contains('is-open')) closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  const mobile = matchMedia('(max-width: 850px)');
  mobile.addEventListener('change', () => closeMenu());

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('pending');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    if (!reducedMotion.matches) document.querySelectorAll('.reveal').forEach(element => {
      element.classList.add('pending');
      revealObserver.observe(element);
    });
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) document.querySelectorAll('.pending').forEach(element => element.classList.remove('pending'));
    });
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navigation.querySelectorAll('a').forEach(link => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
    document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));
  }
  const backTop = document.querySelector('.back-top');
  function updateBackTop() { backTop.hidden = window.scrollY < 700; }
  window.addEventListener('scroll', updateBackTop, { passive: true });
  updateBackTop();

  const stageButtons = [...document.querySelectorAll('[data-stage]')];
  function selectStage(button) {
    stageButtons.forEach(item => {
      const selected = item === button;
      item.setAttribute('aria-expanded', String(selected));
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
  }
  stageButtons.forEach(button => button.addEventListener('click', () => selectStage(button)));
  selectStage(stageButtons[0]);

  const form = document.querySelector('#inquiry-form');
  const status = document.querySelector('#form-status');
  const fallback = document.querySelector('#email-fallback');
  const prepared = document.querySelector('#prepared-message');
  const openEmail = document.querySelector('#open-email');
  const copyButton = document.querySelector('#copy-message');
  function fieldError(field) {
    if (!field.value.trim()) return 'Please complete this field.';
    if (field.type === 'email' && (field.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim()))) return 'Enter a valid email address, such as name@example.com.';
    return '';
  }
  function showError(field, error) {
    field.setAttribute('aria-invalid', String(Boolean(error)));
    document.getElementById(`${field.id}-error`).textContent = error;
  }
  form.querySelectorAll('[required]').forEach(field => {
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') showError(field, fieldError(field));
    });
  });
  // Editing makes the previous draft stale. Require preparation again.
  form.addEventListener('input', event => {
    if (event.target === prepared) return;
    fallback.hidden = true;
    status.textContent = '';
    openEmail.removeAttribute('href');
    openEmail.hidden = true;
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    let firstInvalid;
    form.querySelectorAll('[required]').forEach(field => {
      const error = fieldError(field);
      showError(field, error);
      if (error && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      status.textContent = 'Please check the required fields highlighted above.';
      firstInvalid.focus();
      return;
    }
    const values = new FormData(form);
    const subject = `Literary Representation Inquiry — ${String(values.get('Book Title')).trim().replace(/[\r\n]/g, ' ')}`;
    const body = [...values].filter(([, value]) => String(value).trim()).map(([label, value]) => `${label}: ${String(value).trim()}`).join('\n\n');
    const recipient = String(window.MIKE_PETRO_CONFIG?.recipientEmail || '').trim();
    const configured = /^[^\s@<>?,;:\r\n]+@[^\s@<>?,;:\r\n]+\.[^\s@<>?,;:\r\n]+$/.test(recipient);
    prepared.value = `${configured ? `To: ${recipient}\n` : ''}Subject: ${subject}\n\n${body}`;
    copyButton.textContent = 'Copy prepared message';
    fallback.hidden = false;
    if (!configured) {
      status.textContent = 'Your inquiry is prepared. Email inquiries are not yet available because Mike’s recipient address has not been configured. You can copy your draft below; please call (332) 208-5295 to discuss your inquiry.';
      openEmail.hidden = true;
      openEmail.removeAttribute('href');
      return;
    }
    const mailto = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    openEmail.href = mailto;
    openEmail.hidden = false;
    status.textContent = 'Your inquiry is prepared. Opening your email application; please review it and click Send yourself. If nothing opens, copy the message below.';
    // External protocol opens a draft only. The visitor chooses whether to send.
    openEmail.click();
  });
  copyButton.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(prepared.value);
      copyButton.textContent = 'Message copied';
      status.textContent = 'Prepared message copied. Paste it into your email service, review it, and send it yourself.';
    } catch {
      prepared.focus();
      prepared.select();
      prepared.setSelectionRange(0, prepared.value.length);
      status.textContent = 'Select and copy the prepared message below using your device’s copy command, then paste it into your email service.';
    }
  });
  // Keep submission unavailable until all handlers exist, including without JS.
  // This prevents the browser's default GET submission from exposing form data.
  form.querySelector('[type="submit"]').disabled = false;
})();
