import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { matchIntent, normalizeQuestion, resolveAnswer } from '../assistant-intents.mjs';
import { buildAssistantKnowledge, textFromHtml } from '../assistant-knowledge.mjs';
import worker from '../dist/server/index.js';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const knowledge = Object.fromEntries(await Promise.all(['en', 'et', 'ru'].map(async locale => [locale, JSON.parse(await read(`public/assistant-${locale}.json`))])));

test('FAQ routing recognizes natural questions in all three languages', () => {
  const cases = {
    contact: ['Contact', "What's your email?", 'I want to write to you', 'Where can I send a message?', 'Tere, kuidas ühendust võtta?', 'Mis on teie e-posti aadress?', 'Какой ваш адрес электронной почты?', 'Открой контакты'],
    general: ['What is Vooglin?', 'What can I find here?', 'What is this website about?', 'Mida te teete?', 'Для кого?'],
    services: ['Hi, what services do you offer?', 'Teenused', 'Покажи услуги'],
    pricing: ['How much does it cost?', 'Hinnad', 'Расскажите о ценах'],
    savings: ['How much time can I save?', 'Kalkulaator', 'Сколько времени я могу сэкономить?'],
    consultation: ['How long does a consultation last?', 'Broneeri kohtumine', 'Записаться на консультацию'],
    privacy: ['Where is the privacy policy?', 'Andmete töötlemine', 'Политика конфиденциальности'],
    deletion: ['How do I delete my data? What is your email?', 'Kuidas andmeid kustutada?', 'Как удалить мои данные?'],
    security: ['How do you protect my data?', 'Kas minu andmed on turvalised?', 'Как вы защищаете мои данные?'],
    rights: ['What are my rights?', 'Minu õigused', 'Какие у меня права?'],
    retention: ['How long do you keep my data?', 'Kui kaua andmeid säilitate?', 'Как долго вы храните данные?'],
    documents: ['Email automation', 'Автоматизация писем'],
    local: ['Do you store my questions?', 'Об этом помощнике'],
  };
  for (const [expected, questions] of Object.entries(cases)) for (const question of questions) assert.equal(matchIntent(question).id, expected, question);
  assert.equal(normalizeQuestion('  ÕIGUSED?!  '), 'oigused');
});

test('unpublished facts and unrelated queries get an honest fallback', () => {
  for (const question of [
    'Who won Formula 1 yesterday?', 'What projects do you have?', 'Show me the news', 'Your terms',
    'Do you sell personal data?', 'Are my data encrypted?', 'Does the website use cookies?',
    'How long does a project take?', 'Kui kaua projekt kestab?', 'Как долго идет проект?',
    'Какой ваш адрес?', 'Mis on teie telefon?', 'Hi, who won the race today?', '',
  ]) {
    assert.equal(matchIntent(question).id, 'fallback', question);
    assert.equal(resolveAnswer(question, knowledge.en).text, knowledge.en.ui.missing);
  }
  assert.equal(matchIntent('email').id, 'contact', 'AI must not match a substring of email');
});

test('every factual answer is derived from the current localized public pages', async () => {
  for (const locale of ['en', 'et', 'ru']) {
    const base = locale === 'en' ? 'public/' : `public/${locale}/`;
    const pages = { home: await read(`${base}index.html`), pricing: await read(`${base}pricing/index.html`), privacy: await read(`${base}privacy/index.html`) };
    assert.deepEqual(buildAssistantKnowledge(pages, locale), knowledge[locale]);
    const publicText = textFromHtml(Object.values(pages).join(' '));
    for (const [id, topic] of Object.entries(knowledge[locale].topics)) {
      assert.ok(topic.text?.trim(), `${locale}/${id} has an answer`);
      for (const sentence of topic.text.split(/\.\s+| · /).filter(Boolean)) assert.ok(publicText.includes(sentence), `${locale}/${id}: ${sentence}`);
      for (const detail of topic.details?.items || []) {
        for (const part of detail.split(': ')) assert.ok(publicText.includes(part), `${locale}/${id} details are source text`);
      }
    }
    const missing = { ...pages, home: pages.home.replace('id="services"', 'id="removed-services"') };
    assert.throws(() => buildAssistantKnowledge(missing, locale), /knowledge source missing/);
  }
});

test('policy answers preserve retention categories and legal qualifications', () => {
  const topics = knowledge.en.topics;
  assert.match(topics.deletion.text, /Where there is no legal, contractual or legitimate reason/);
  assert.match(topics.credentials.text, /do not automatically remain active/);
  assert.match(topics.crm.text, /latest meaningful interaction/);
  assert.match(topics.security.text, /No method of storage or transmission can guarantee absolute security/);
  assert.equal(topics.retention.details.items.length, 5);
  assert.match(topics.retention.details.items[3], /Only for as long as reasonably necessary/);
  assert.match(topics.rights.details.intro, /Where applicable/);
  assert.match(topics.rights.details.after, /required by law/);
  assert.match(topics.consultation.text, /30/);
  assert.match(topics.consultation.text, /confirm.*email/i);
});

test('knowledge navigation resolves to real routes and anchors in the selected language', async () => {
  for (const [locale, data] of Object.entries(knowledge)) {
    const actions = [...data.fallbackActions, ...Object.values(data.topics).flatMap(topic => topic.actions)];
    for (const action of actions) {
      const url = new URL(action.href, 'https://vooglin.ee');
      if (url.protocol === 'mailto:') { assert.equal(url.pathname, 'egor@vooglin.ee'); continue; }
      assert.equal(url.origin, 'https://vooglin.ee');
      if (locale !== 'en') assert.ok(url.pathname.startsWith(`/${locale}/`));
      const html = await read(`public${url.pathname}index.html`);
      if (url.hash) assert.ok(html.includes(`id="${url.hash.slice(1)}"`), action.href);
      if (action.kind === 'booking') assert.ok(html.includes('data-booking-open'));
    }
    for (const page of ['home', 'pricing', 'privacy']) {
      const answer = resolveAnswer('Where am I?', data, page);
      assert.ok(answer.text.includes(data.pages[page].title));
      assert.ok(answer.actions.length > 0);
    }
  }
});

test('all nine pages keep the original robot and add a distinct localized helper mount', async () => {
  for (const locale of ['en', 'et', 'ru']) for (const page of ['', 'pricing/', 'privacy/']) {
    const html = await read(`public/${locale === 'en' ? '' : `${locale}/`}${page}index.html`);
    assert.equal((html.match(/class="vooglin-robot"/g) || []).length, 1);
    assert.equal((html.match(/data-assistant-mount/g) || []).length, 1);
    assert.ok(html.includes(`data-assistant-label="${knowledge[locale].ui.open}"`));
    assert.ok(html.includes('/assistant.mjs?v='));
    assert.ok(html.includes('/assistant.css?v='));
  }
});

test('the existing server serves the assistant static assets with correct MIME types', async () => {
  for (const [name, type] of [['assistant.mjs', 'text/javascript'], ['assistant-intents.mjs', 'text/javascript'], ['assistant.css', 'text/css'], ...['en', 'et', 'ru'].map(locale => [`assistant-${locale}.json`, 'application/json'])]) {
    const response = await worker.fetch(new Request(`https://vooglin.ee/${name}?v=20260914`), {});
    assert.equal(response.status, 200, name);
    assert.ok(response.headers.get('content-type').startsWith(type));
    assert.equal(await response.text(), await read(`public/${name}`));
  }
});
