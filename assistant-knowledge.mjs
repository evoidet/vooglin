// Build-time extraction only. Published HTML, not translations or examples,
// supplies every factual answer. A missing source stops the build.
import { localizeText } from "./localize.mjs";

export function textFromHtml(html) {
  const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return html.replace(/<[^>]*>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (match, entity) => {
      if (entity[0] === "#") return String.fromCodePoint(Number.parseInt(entity.slice(entity[1] === "x" ? 2 : 1), entity[1] === "x" ? 16 : 10));
      return entities[entity] || match;
    }).replace(/\s+/g, " ").trim();
}

function required(html, expression, description) {
  const match = html.match(expression);
  if (!match) throw new Error(`Assistant knowledge source missing: ${description}`);
  return match[1];
}

function section(html, id) {
  return required(html, new RegExp(`<section\\b[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)<\\/section>`), id);
}

function paragraphs(html) {
  return [...html.matchAll(/<p\b(?![^>]*class="(?:privacy-section-number|section-label|eyebrow))[^>]*>([\s\S]*?)<\/p>/g)].map(match => textFromHtml(match[1]));
}

const uiSource = {
  title: "Website helper", open: "Open website helper", close: "Minimize helper", greeting: "Hi! Need a hand?",
  welcome: "Hi! I can help you find your way around Vooglin. Choose a topic or ask me a question.",
  question: "Your question", placeholder: "Ask about Vooglin…", send: "Send", you: "You", helper: "Helper",
  privacyNote: "Questions stay in this tab. This helper does not send messages.",
  missing: "I couldn't find that information on the website. Try one of these pages, or get in touch.",
  loading: "Finding that on the website…", unavailable: "The helper could not load. You can still use the website navigation.",
  retry: "Try again", current: "You're on: {page}", source: "Read more", policy: "Read full policy", home: "Home",
  services: "Services", pricing: "Pricing", privacy: "Privacy", contact: "Contact", about: "About", process: "How it works",
  savings: "Time savings calculator", consultation: "Book a free consultation", email: "Send an email", general: "What does Vooglin do?",
  local: "About this helper", localAnswer: "I look up information from Vooglin's public pages. Your questions stay in this tab; only greeting and panel preferences are saved for this browsing session.",
  help: "Try asking about services, pricing, time savings, contact details or the privacy policy.",
  details: "Details from the page",
};

export function buildAssistantKnowledge({ home, pricing, privacy }, locale) {
  const base = locale === "en" ? "/" : `/${locale}/`;
  const ui = Object.fromEntries(Object.entries(uiSource).map(([key, value]) => [key, localizeText(value, locale)]));
  const action = (label, href, kind = "navigate") => ({ label, href, kind });
  const homeLink = action(ui.home, base);
  const pricingLink = action(ui.pricing, `${base}pricing/`);
  const privacyLink = action(ui.policy, `${base}privacy/`);
  const contactLink = action(ui.contact, `${base}pricing/#contact`);
  const email = required(home, /href="mailto:([^"?]+)"/, "public contact email");
  const contactActions = [action(ui.email, `mailto:${email}`, "email"), contactLink];
  const hero = textFromHtml(required(home, /<p class="hero-description">([\s\S]*?)<\/p>/, "homepage description"));
  const serviceSection = section(home, "services");
  const aboutSection = section(home, "about");
  const topics = {
    general: { text: hero, actions: [action(ui.services, `${base}#services`), contactLink] },
    services: { text: [...serviceSection.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map(match => textFromHtml(match[1])).join(" · "), actions: [action(ui.services, `${base}#services`)] },
    about: { text: textFromHtml(required(aboutSection, /<figcaption>([\s\S]*?)<\/figcaption>/, "founder")) + ". " + textFromHtml(required(aboutSection, /<span class="portrait-index">([\s\S]*?)<\/span>/, "location")) + ". " + paragraphs(aboutSection)[0], actions: [action(ui.about, `${base}#about`)] },
    process: { text: paragraphs(section(home, "process")).join(" "), actions: [action(ui.process, `${base}#process`)] },
    pricing: { text: textFromHtml(required(pricing, /<div class="pricing-hero-copy">\s*<p>([\s\S]*?)<\/p>/, "pricing introduction")), actions: [pricingLink, contactLink] },
    contact: { text: email, actions: contactActions },
    consultation: { text: textFromHtml(required(home, /<p class="eyebrow eyebrow-dark"><span><\/span>([\s\S]*?)<\/p>/, "consultation duration")) + ". " + textFromHtml(required(home, /<p id="booking-intro">([\s\S]*?)<\/p>/, "booking request explanation")), actions: [action(ui.consultation, `${base}?consultation=1`, "booking"), ...contactActions.slice(0, 1)] },
    savings: { text: textFromHtml(required(home, /<p class="calculator-disclaimer">([\s\S]*?)<\/p>/, "calculator disclaimer")), actions: [action(ui.savings, `${base}#savings`)] },
    privacy: { text: textFromHtml(required(privacy, /<p class="privacy-intro">([\s\S]*?)<\/p>/, "privacy introduction")), actions: [privacyLink] },
  };
  // Preserve complete source paragraphs for legal answers, including qualifications.
  // Topics with lists point to the complete list rather than inventing a summary.
  const policyParagraphs = {
    purposes: [0, 1], deletion: [0], credentials: [2], security: [0, 1],
    providers: [0, 1], systems: [1, 3], crm: [1, 2],
  };
  for (const [id, indexes] of Object.entries(policyParagraphs)) {
    const sourceId = id === "systems" ? "customer-systems" : id;
    const source = section(privacy, sourceId);
    const content = paragraphs(source);
    if (indexes.some(index => !content[index])) throw new Error(`Incomplete assistant policy source: ${id}`);
    topics[id] = { text: indexes.map(index => content[index]).join(" "), actions: [action(ui.policy, `${base}privacy/#${sourceId}`)] };
  }
  for (const id of ["information", "rights", "retention"]) {
    const source = section(privacy, id);
    const heading = textFromHtml(required(source, /<h2[^>]*>([\s\S]*?)<\/h2>/, id));
    const blocks = paragraphs(source);
    // A table/list is essential to these policies. Keep the answer short and link
    // directly to the complete source; never imply one period applies to all data.
    const items = id === "retention"
      ? [...source.matchAll(/<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g)].map(match => `${textFromHtml(match[1])}: ${textFromHtml(match[2])}`)
      : [...source.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(match => textFromHtml(match[1]));
    topics[id] = { text: `${heading}. ${blocks.at(-1)}`, details: { intro: id === "retention" ? "" : blocks[0], items, after: id === "rights" ? blocks[1] : "" }, actions: [action(ui.policy, `${base}privacy/#${id}`)] };
  }
  const serviceIds = ["tools", "forms", "documents", "reporting", "ai", "custom"];
  [...serviceSection.matchAll(/<article class="service-row"[^>]*>([\s\S]*?)<\/article>/g)].forEach((match, index) => {
    topics[serviceIds[index]] = { text: paragraphs(match[1])[0], actions: [action(ui.services, `${base}#services`)] };
  });
  for (const [id, sourceIndex] of [["support", 2], ["focused", 0], ["connected", 1]]) {
    const rows = [...pricing.matchAll(/<article class="pricing-row"[^>]*>([\s\S]*?)<\/article>/g)];
    const row = rows[sourceIndex]?.[1];
    if (!row) throw new Error(`Missing pricing source: ${id}`);
    topics[id] = { text: paragraphs(row)[0] + " " + textFromHtml(required(row, /<div class="pricing-value">([\s\S]*?)<\/div>/, id)), actions: [pricingLink] };
  }
  const costSection = required(pricing, /<section class="pricing-note"[^>]*>([\s\S]*?)<\/section>/, "external software costs");
  topics.costs = { text: paragraphs(costSection).at(-1), actions: [pricingLink] };
  return {
    version: 1, locale, ui, topics,
    pages: {
      home: { title: textFromHtml(required(home, /<h1[^>]*>([\s\S]*?)<\/h1>/, "home title")), actions: ["services", "process", "savings"] },
      pricing: { title: textFromHtml(required(pricing, /<h1[^>]*>([\s\S]*?)<\/h1>/, "pricing title")), actions: ["pricing", "costs", "contact"] },
      privacy: { title: textFromHtml(required(privacy, /<h1[^>]*>([\s\S]*?)<\/h1>/, "privacy title")), actions: ["privacy", "retention", "deletion"] },
    },
    fallbackActions: [homeLink, pricingLink, contactLink, privacyLink],
  };
}
