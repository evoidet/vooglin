// A separate companion. The original .robot-perch and its scripts stay untouched.
const mount = document.querySelector('[data-assistant-mount]');
const locale = ['et', 'ru'].includes(document.documentElement.lang) ? document.documentElement.lang : 'en';
const page = /\/privacy(?:\/|$)/.test(location.pathname) ? 'privacy' : /\/pricing(?:\/|$)/.test(location.pathname) ? 'pricing' : 'home';
const storage = {
  get(key) { try { return sessionStorage.getItem(`vooglin-helper:${key}`); } catch { return null; } },
  set(key, value) { try { sessionStorage.setItem(`vooglin-helper:${key}`, value); } catch { /* Optional preference only. */ } },
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function robot() {
  // Trusted, static SVG only. User input and knowledge always use textContent.
  const template = document.createElement('template');
  template.innerHTML = `<svg class="site-assistant-avatar" viewBox="0 0 100 104" aria-hidden="true" focusable="false">
    <g class="site-assistant-character">
      <path d="M50 16V8" stroke="#91a86b" stroke-width="4" stroke-linecap="round"/>
      <circle cx="50" cy="7" r="4" fill="#ddff6a"/>
      <rect x="15" y="22" width="70" height="49" rx="20" fill="#ddff6a"/>
      <rect x="9" y="37" width="8" height="20" rx="4" fill="#a3bd50"/>
      <rect x="83" y="37" width="8" height="20" rx="4" fill="#a3bd50"/>
      <rect x="24" y="31" width="52" height="31" rx="12" fill="#1b2119"/>
      <g class="site-assistant-eyes" fill="#ddff6a"><rect x="34" y="40" width="7" height="10" rx="3.5"/><rect x="59" y="40" width="7" height="10" rx="3.5"/></g>
      <path d="M45 53Q50 57 55 53" fill="none" stroke="#ddff6a" stroke-width="2" stroke-linecap="round"/>
      <rect x="33" y="74" width="34" height="15" rx="7" fill="#b8d45c"/>
      <path d="M24 76L18 81M76 76L82 81M40 88V91M60 88V91" stroke="#ddff6a" stroke-width="7" stroke-linecap="round"/>
    </g>
    <path d="M77 65h15a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5h-5l-7 6v-6h-3a5 5 0 0 1-5-5V70a5 5 0 0 1 5-5Z" fill="#f6f8ed" stroke="#1b2119" stroke-width="2"/>
    <path d="M82 73q0-4 4-4t4 4q0 3-4 4v2" fill="none" stroke="#1b2119" stroke-width="2" stroke-linecap="round"/>
    <circle cx="86" cy="83" r="1.4" fill="#1b2119"/>
  </svg>`;
  return template.content.firstElementChild;
}

if (mount) initialize();

function initialize() {
  const launcher = element('button', 'site-assistant-launcher');
  launcher.type = 'button';
  launcher.setAttribute('aria-label', mount.dataset.assistantLabel);
  launcher.title = mount.dataset.assistantLabel;
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', 'site-assistant-panel');
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.append(robot());
  mount.append(launcher);
  mount.hidden = false;

  const panel = element('section', 'site-assistant-panel');
  panel.id = 'site-assistant-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', mount.dataset.assistantLabel);
  const greeting = element('div', 'site-assistant-greeting');
  greeting.hidden = true;
  greeting.setAttribute('aria-hidden', 'true');
  document.body.append(panel, greeting);
  let knowledge, resolver, pending, input, log, timer, greeted = false;
  let frame = 0;
  const header = document.querySelector('.site-header');
  const booking = document.querySelector('.booking-modal');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

  function close(restoreFocus = true) {
    const wasOpen = !panel.hidden;
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    storage.set('panel', 'closed');
    if (restoreFocus && wasOpen) launcher.focus({ preventScroll: true });
  }

  function hideGreeting() { greeting.hidden = true; clearTimeout(timer); }

  function position() {
    frame = 0;
    const viewport = window.visualViewport;
    const leftEdge = (viewport?.offsetLeft || 0) + 12;
    const rightEdge = leftEdge + (viewport?.width || innerWidth) - 24;
    const topEdge = Math.max(header.getBoundingClientRect().bottom + 10, (viewport?.offsetTop || 0) + 10);
    const bottomEdge = (viewport?.offsetTop || 0) + (viewport?.height || innerHeight) - 12;
    const originalRobots = [...document.querySelectorAll('.robot-perch')].map(node => node.getBoundingClientRect()).filter(rect => rect.width && rect.bottom > topEdge && rect.top < bottomEdge);
    if (!greeting.hidden) {
      const button = launcher.getBoundingClientRect();
      greeting.style.left = `${Math.max(leftEdge, Math.min(button.right - greeting.offsetWidth, rightEdge - greeting.offsetWidth))}px`;
      greeting.style.top = `${topEdge}px`;
      // Never lay a proactive bubble over page content, links, or the original pet.
      const bubble = greeting.getBoundingClientRect();
      const important = [...document.querySelectorAll('main h1, main h2, main p, main a, main button, main input, .robot-perch')];
      if (important.some(node => overlap(bubble, node.getBoundingClientRect()))) hideGreeting();
    }
    if (panel.hidden) return;
    const width = Math.min(380, rightEdge - leftEdge);
    const height = Math.min(550, bottomEdge - topEdge);
    const options = [];
    for (const left of [rightEdge - width, leftEdge]) {
      let top = topEdge, bottom = topEdge + height;
      for (const rect of originalRobots) {
        if (!overlap({ left, right: left + width, top, bottom }, rect)) continue;
        if (rect.top - top >= bottomEdge - rect.bottom) bottom = rect.top - 10;
        else { top = rect.bottom + 10; bottom = Math.min(bottomEdge, top + height); }
      }
      options.push({ left, top, height: bottom - top });
    }
    // Prefer the launcher's side when it has enough room for a useful panel.
    const best = options[0].height >= Math.min(360, height) ? options[0] : options.sort((a, b) => b.height - a.height)[0];
    if (best.height < 210) { close(false); return; }
    panel.style.left = `${best.left}px`;
    panel.style.top = `${best.top}px`;
    panel.style.width = `${width}px`;
    panel.style.height = `${best.height}px`;
    panel.classList.toggle('site-assistant-compact', best.height < 360);
  }

  function schedulePosition() { if (!frame) frame = requestAnimationFrame(position); }

  function actionLink(action) {
    const link = element('a', 'site-assistant-action', action.label);
    const url = new URL(action.href, location.href);
    if (url.origin !== location.origin && url.protocol !== 'mailto:') return element('span', '', action.label);
    link.href = action.href;
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
      if (action.kind === 'booking' && page === 'home') {
        const trigger = document.querySelector('.hero-actions [data-booking-open]');
        if (trigger) { event.preventDefault(); close(false); trigger.click(); return; }
      }
      close(false);
      if (url.origin === location.origin && url.pathname === location.pathname && url.hash) {
        const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
        if (target) {
          event.preventDefault();
          history.pushState(null, '', url.hash);
          target.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
          const hadTabindex = target.hasAttribute('tabindex');
          if (!hadTabindex) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
          if (!hadTabindex) target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
        }
      }
    });
    return link;
  }

  function message(text, actions = [], fromUser = false, details) {
    const item = element('div', `site-assistant-message${fromUser ? ' site-assistant-message-user' : ''}`);
    item.append(element('span', 'site-assistant-speaker', fromUser ? knowledge.ui.you : knowledge.ui.helper), element('p', '', text));
    if (details) {
      const disclosure = element('details', 'site-assistant-details');
      disclosure.append(element('summary', '', knowledge.ui.details));
      if (details.intro) disclosure.append(element('p', '', details.intro));
      const list = element('ul');
      details.items.forEach(text => list.append(element('li', '', text)));
      disclosure.append(list);
      if (details.after) disclosure.append(element('p', '', details.after));
      item.append(disclosure);
    }
    if (actions.length) {
      const links = element('div', 'site-assistant-links');
      actions.forEach(action => links.append(actionLink(action)));
      item.append(links);
    }
    log.append(item);
    // Bound the in-memory transcript for long visits; never persist questions.
    while (log.children.length > 40) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }

  function answer(question) {
    const value = question.trim().slice(0, 400);
    if (!value || !knowledge) return;
    message(value, [], true);
    const response = resolver(value, knowledge, page);
    message(response.text, response.actions, false, response.details);
    panel.classList.remove('site-assistant-answering');
    requestAnimationFrame(() => panel.classList.add('site-assistant-answering'));
  }

  function render() {
    const { ui } = knowledge;
    panel.replaceChildren();
    panel.setAttribute('aria-labelledby', 'site-assistant-title');
    panel.removeAttribute('aria-label');
    const heading = element('div', 'site-assistant-heading');
    const title = element('h2', '', ui.title);
    title.id = 'site-assistant-title';
    const minimize = element('button', 'site-assistant-close', '−');
    minimize.type = 'button';
    minimize.setAttribute('aria-label', ui.close);
    minimize.title = ui.close;
    minimize.addEventListener('click', () => close());
    heading.append(robot(), title, minimize);
    const context = element('p', 'site-assistant-context', ui.current.replace('{page}', knowledge.pages[page].title));
    log = element('div', 'site-assistant-log');
    log.setAttribute('role', 'log');
    log.setAttribute('aria-live', 'polite');
    log.setAttribute('aria-label', ui.title);
    log.setAttribute('tabindex', '0');
    const quick = element('div', 'site-assistant-quick');
    for (const id of ['general', 'services', 'pricing', 'contact', 'privacy', 'savings']) {
      const button = element('button', 'site-assistant-action', ui[id]);
      button.type = 'button';
      button.addEventListener('click', () => {
        message(ui[id], [], true);
        message(knowledge.topics[id].text, knowledge.topics[id].actions);
      });
      quick.append(button);
    }
    const form = element('form', 'site-assistant-form');
    const label = element('label', 'site-assistant-sr', ui.question);
    label.htmlFor = 'site-assistant-question';
    input = element('input', 'site-assistant-input');
    input.id = 'site-assistant-question';
    input.type = 'text';
    input.placeholder = ui.placeholder;
    input.maxLength = 400;
    input.autocomplete = 'off';
    input.enterKeyHint = 'send';
    const send = element('button', 'site-assistant-send', ui.send);
    send.type = 'submit';
    send.disabled = true;
    input.addEventListener('input', () => { send.disabled = !input.value.trim(); });
    form.addEventListener('submit', event => {
      event.preventDefault();
      answer(input.value);
      input.value = '';
      send.disabled = true;
      input.focus({ preventScroll: true });
    });
    form.append(label, input, send);
    const note = element('p', 'site-assistant-note', ui.privacyNote);
    panel.append(heading, context, log, quick, form, note);
    message(ui.welcome);
  }

  async function load() {
    if (knowledge) return true;
    if (pending) return pending;
    pending = (async () => {
      try {
        const [response, module] = await Promise.all([
          fetch(`/assistant-${locale}.json?v=20260914`, { signal: AbortSignal.timeout(10000), credentials: 'omit' }),
          import('./assistant-intents.mjs?v=20260914'),
        ]);
        if (!response.ok) throw new Error('Knowledge unavailable');
        knowledge = await response.json();
        if (knowledge.locale !== locale || !knowledge.topics?.general || !knowledge.pages?.[page]) throw new Error('Invalid knowledge');
        resolver = module.resolveAnswer;
        render();
        return true;
      } catch {
        knowledge = undefined;
        const text = element('p', '', mount.dataset.assistantError);
        const retry = element('button', 'site-assistant-action', mount.dataset.assistantRetry);
        retry.type = 'button';
        retry.addEventListener('click', async () => { if (await load()) { position(); input?.focus({ preventScroll: true }); } });
        const dismiss = element('button', 'site-assistant-close', '×');
        dismiss.type = 'button';
        dismiss.setAttribute('aria-label', document.querySelector('.menu-toggle')?.dataset.closeLabel || 'Close');
        dismiss.addEventListener('click', () => close());
        panel.replaceChildren(dismiss, text, retry);
        return false;
      } finally { pending = null; }
    })();
    return pending;
  }

  async function open(focus = true) {
    hideGreeting();
    if (header.classList.contains('is-open')) document.querySelector('.menu-toggle')?.click();
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    storage.set('panel', 'open');
    if (!knowledge && !panel.childElementCount) {
      const status = element('p', '', mount.dataset.assistantLoading);
      status.setAttribute('role', 'status');
      const dismiss = element('button', 'site-assistant-close', '×');
      dismiss.type = 'button';
      dismiss.setAttribute('aria-label', document.querySelector('.menu-toggle')?.dataset.closeLabel || 'Close');
      dismiss.addEventListener('click', () => close());
      panel.append(dismiss, status);
    }
    position();
    const success = await load();
    if (!panel.hidden) {
      position();
      if (focus) (success ? input : panel.querySelector('button'))?.focus({ preventScroll: true });
    }
  }

  launcher.addEventListener('click', () => panel.hidden ? open() : close());
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); close(); }
  });
  document.addEventListener('focusin', event => {
    if (!panel.hidden && !panel.contains(event.target) && !mount.contains(event.target)) close(false);
  });
  document.addEventListener('pointerdown', event => {
    if (!panel.hidden && !panel.contains(event.target) && !mount.contains(event.target)) close(false);
  });
  // Preserve the existing menu/dialog behavior and prevent competing overlays.
  new MutationObserver(() => {
    if (header.classList.contains('is-open') || booking?.open) { hideGreeting(); close(false); }
  }).observe(header, { attributes: true, attributeFilter: ['class'] });
  if (booking) new MutationObserver(() => { if (booking.open) { hideGreeting(); close(false); } }).observe(booking, { attributes: true, attributeFilter: ['open'] });
  addEventListener('resize', schedulePosition, { passive: true });
  addEventListener('scroll', () => { hideGreeting(); schedulePosition(); }, { passive: true });
  window.visualViewport?.addEventListener('resize', schedulePosition, { passive: true });
  window.visualViewport?.addEventListener('scroll', schedulePosition, { passive: true });

  // Intentional cross-page consultation links use the site's existing dialog.
  if (page === 'home' && new URL(location.href).searchParams.get('consultation') === '1') {
    const url = new URL(location.href);
    url.searchParams.delete('consultation');
    history.replaceState(history.state, '', url);
    requestAnimationFrame(() => document.querySelector('.hero-actions [data-booking-open]')?.click());
  } else if (storage.get('panel') === 'open') {
    open(false);
  } else if (!storage.get('greeted') && !greeted) {
    // UI greeting can load with the site; conversation logic is otherwise lazy.
    greeted = true;
    storage.set('greeted', 'yes');
    load().then(success => {
      if (!success || !panel.hidden || header.classList.contains('is-open') || booking?.open || scrollY > 80) return;
      greeting.textContent = knowledge.ui.greeting;
      greeting.hidden = false;
      position();
      timer = setTimeout(hideGreeting, 4500);
    });
  }
}
