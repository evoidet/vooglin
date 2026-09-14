// Deterministic routing, not generative AI. Queries never leave the browser.
export function normalizeQuestion(value) {
  return String(value).normalize("NFKD").replace(/\p{M}/gu, "")
    .toLocaleLowerCase().replace(/ё/g, "е").replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

const definitions = [
  ["context", ["where am i", "this page", "current page", "kus ma olen", "see leht", "где я", "эта страница"]],
  ["local", ["about this helper", "are you ai", "are you a robot", "save my questions", "store my questions", "send my questions", "sellest abilisest", "kas oled robot", "minu kusimused", "об этом помощнике", "ты робот", "мои вопросы"]],
  ["greeting", ["hi", "hello", "hey", "tere", "hei", "привет", "здравствуите", "спасибо", "thanks", "aitah"]],
  ["help", ["help", "help me find something", "help me", "abi", "aita", "aita leida", "помощь", "помоги", "помогите"]],
  ["general", ["what is vooglin", "what does vooglin do", "what is this website", "what can i find here", "who is this for", "what do you do", "mis on vooglin", "mida te teete", "kellele", "mis veebileht", "что такое vooglin", "чем вы занимаетесь", "что здесь", "для кого"]],
  ["deletion", ["delete my data", "erase my data", "remove my data", "delete my email", "data deletion", "right to erasure", "kustuta", "kustutada", "kustutamine", "удалить", "удаление", "удалите", "стереть"]],
  ["credentials", ["api key", "api keys", "api token", "access token", "credentials", "password", "oauth", "revoke access", "api voti", "api votmed", "juurdepaasuandmed", "parool", "ligipaasu eemald", "ключ api", "ключи api", "токен", "пароль", "отозвать доступ", "учетные данные"]],
  ["retention", ["how long", "retention", "keep my data", "keep data", "store data", "keep information", "kui kaua", "sailitate", "sailitamine", "sailitata", "храните", "хранение", "срок хранения", "как долго", "сколько хран"]],
  ["rights", ["my rights", "privacy rights", "data rights", "correct my data", "withdraw consent", "minu oigused", "andmekaitseoigused", "nousoleku", "мои права", "права на данные", "отозвать согласие", "исправить данные"]],
  ["security", ["security", "data safe", "data secure", "protect data", "safeguards", "turvalisus", "andmed turval", "kaitsete", "безопасность", "защита данных", "данные защищены"]],
  ["providers", ["service providers", "third party", "third parties", "share data", "share my data", "andmete jagamine", "teenusepakkujad", "kolmandad osapooled", "kellega jagate", "передача данных", "поставщики услуг", "третьим лицам", "делитесь данными"]],
  ["systems", ["own my accounts", "customer systems", "account ownership", "access my account", "kliendi susteemid", "minu kontod", "konto omanik", "системы клиента", "мои аккаунты", "владелец аккаунт"]],
  ["crm", ["crm", "customer records", "contact records", "kliendisuhted", "kliendikontaktid", "клиентские записи", "контактные записи"]],
  ["information", ["what data", "which data", "collect data", "collect my data", "milliseid andmeid", "mis andmeid", "какие данные", "собираете данные"]],
  ["purposes", ["what happens to my data", "why do you process", "why collect", "why do you need my data", "legal basis", "mis saab minu andmetest", "miks andmeid", "oiguslik alus", "что происходит с моими данными", "зачем данные", "зачем собираете", "правовое основание"]],
  ["privacy", ["privacy", "privacy policy", "policies", "policy", "personal data", "privaatsus", "privaatsuspoliitika", "isikuandmed", "andmekaitse", "конфиденциальность", "политика конфиденциальности", "персональные данные"]],
  ["consultation", ["consultation", "book a meeting", "book a call", "booking", "appointment", "konsultatsioon", "broneeri", "kohtumine", "kohtumist", "консультация", "консультацию", "встреча", "встречу", "записаться"]],
  ["contact", ["contact", "email", "e mail", "write to you", "send a message", "get in touch", "reach you", "kontakt", "uhendust", "kirjutada", "kirjuta", "e post", "saata sonum", "связаться", "связь", "контакт", "почта", "почты", "написать", "отправить сообщение"]],
  ["costs", ["software costs", "third party costs", "subscription costs", "software subscriptions", "tarkvara kulud", "tarkvarakulud", "tarkvara hind", "расходы на сервисы", "стоимость подписок", "расходы на программы"]],
  ["pricing", ["pricing", "price", "prices", "cost", "costs", "how much", "quote", "budget", "hinnad", "hind", "maksab", "maksumus", "hinnapakkumine", "цена", "цены", "стоимость", "сколько стоит", "стоит", "расценки", "бюджет"]],
  ["savings", ["calculator", "calculate", "time savings", "save time", "hours saved", "kalkulaator", "aega saasta", "ajasääst", "ajasaast", "калькулятор", "экономия времени", "сэкономить время"]],
  ["process", ["how it works", "how do we start", "how to start", "get started", "your process", "kuidas alustada", "kuidas see tootab", "tooprotsess", "как начать", "как это работает", "этапы работы"]],
  ["about", ["about", "founder", "egor", "who are you", "where are you based", "location", "meist", "asutaja", "kus asute", "kes te olete", "о нас", "егор", "основатель", "где находитесь", "кто вы"]],
  ["support", ["ongoing support", "maintenance", "support after launch", "hooldus", "jooksev tugi", "toetus parast", "поддержка после запуска", "обслуживание"]],
  ["forms", ["forms", "form responses", "vormid", "vorme", "vormide", "формы", "формами", "заявки"]],
  ["documents", ["documents", "reminders", "confirmations", "automate emails", "email automation", "dokumendid", "dokumente", "meeldetuletused", "e kirjade", "документы", "напоминания", "подтверждения", "автоматизация писем"]],
  ["reporting", ["reports", "reporting", "dashboard", "task progress", "aruanded", "aruandlus", "toode seis", "отчеты", "отчетность", "статусы задач"]],
  ["ai", ["ai", "artificial intelligence", "summarise", "summarize", "tehisaru", "tehisintellekt", "kokkuvotted", "ии", "искусственныи интеллект"]],
  ["tools", ["connect tools", "integrations", "spreadsheets", "google sheets", "uhenda tooriistad", "tabelid", "integratsioonid", "интеграции", "таблицы", "связать инструменты"]],
  ["services", ["services", "automate", "automation", "teenused", "automatiseerimine", "automatiseerite", "услуги", "автоматизация", "автоматизируете"]],
];

const prepared = definitions.map(([id, aliases]) => ({ id, aliases: aliases.map(normalizeQuestion) }));
// Common phrasing and inflections, kept with the routing layer rather than UI copy.
for (const [id, aliases] of Object.entries({
  general: ["what is the website about", "what is this site about"],
  contact: ["e posti aadress", "e posti", "e postiaadress", "электронной почты", "электронная почта", "контакты", "контактов"],
  pricing: ["ценах", "цену"],
  savings: ["how much time", "time can i save", "aega saastan", "сколько времени"],
  rights: ["какие у меня права"],
  security: ["protect my data", "minu andmed on turvalised", "защищаете мои данные"],
  privacy: ["data processing", "andmete tootlemine", "обработка данных"],
})) prepared.find(item => item.id === id).aliases.push(...aliases.map(normalizeQuestion));
const contains = (question, phrase) => (` ${question} `).includes(` ${phrase} `);
const unsupported = [
  "news", "latest news", "events", "portfolio", "past projects", "your projects", "what projects", "show projects", "projects page", "clients", "testimonials", "terms", "rules", "refund", "cookies", "tracking", "gdpr certified", "sell my data", "sell data", "only in the eu", "encrypted", "encryption", "phone", "telephone", "street address", "guaranteed", "yesterday", "weather", "formula 1", "formula one", "f1",
  "uudised", "uritused", "portfoolio", "teie projektid", "projektide leht", "tingimused", "reeglid", "tagasimakse", "kupsised", "jalgimine", "muute andmeid", "telefon", "aadress", "eile",
  "новости", "события", "мероприятия", "портфолио", "ваши проекты", "какие проекты", "проекты", "условия", "правила", "возврат", "куки", "отслеживание", "продаете данные", "шифрование", "телефон", "адрес", "вчера",
].map(normalizeQuestion);

export function matchIntent(input) {
  const question = normalizeQuestion(input).slice(0, 400);
  if (!question) return { id: "fallback", score: 0 };
  let scores = prepared.map(({ id, aliases }) => {
    const matches = aliases.filter(alias => contains(question, alias));
    const score = matches.reduce((best, alias) => Math.max(best, alias === question ? 10 : 3 + Math.min(4, alias.split(" ").length)), 0);
    return { id, score };
  }).filter(result => result.score > 0);
  const found = id => scores.find(result => result.id === id);
  // Specific privacy questions take precedence over contact/general data words.
  // Missing policy topics must never become a reassuring generic privacy answer.
  const emailAddress = /e posti|e postiaadress|электроннои почты|электронная почта|email|e mail/.test(question);
  if (unsupported.some(phrase => contains(question, phrase) && !(emailAddress && ["aadress", "адрес"].includes(phrase)))) return { id: "fallback", score: 0 };
  if (/\b(sell|selling|sold)\b/.test(question) || /\bmuute\b|продаете|продажа/.test(question)) return { id: "fallback", score: 0 };
  const dataDuration = /\b(data|information|retention|records|crm|store|keep|privacy)\b|andm|sailit|хран|данн/.test(question);
  if (!dataDuration) scores = scores.filter(result => result.id !== "retention");
  if (scores.some(result => result.id !== "greeting" && result.id !== "help")) scores = scores.filter(result => !["greeting", "help"].includes(result.id));
  for (const id of ["local", "deletion", "credentials", "retention", "rights", "security", "providers", "systems", "crm", "information", "purposes"]) {
    if (found(id)) return found(id);
  }
  scores.sort((a, b) => b.score - a.score);
  // An incidental greeting must not answer an otherwise unknown question.
  if (scores[0]?.id === "greeting" && question.split(" ").length > 4) return { id: "fallback", score: 0 };
  // Specific service needs win over a general mention of email or automation.
  for (const id of ["consultation", "costs", "documents", "savings"]) if (found(id)) return found(id);
  return scores[0] || { id: "fallback", score: 0 };
}

export function resolveAnswer(input, knowledge, page = "home") {
  const { id } = matchIntent(input);
  if (id === "greeting") return { id, text: knowledge.ui.welcome, actions: knowledge.fallbackActions };
  if (id === "help") return { id, text: knowledge.ui.help, actions: knowledge.fallbackActions };
  if (id === "local") return { id, text: knowledge.ui.localAnswer, actions: [] };
  if (id === "context") {
    const context = knowledge.pages[page] || knowledge.pages.home;
    return { id, text: knowledge.ui.current.replace("{page}", context.title), actions: context.actions.flatMap(topic => knowledge.topics[topic]?.actions.slice(0, 1) || []) };
  }
  if (knowledge.topics[id]) return { id, ...knowledge.topics[id] };
  return { id: "fallback", text: knowledge.ui.missing, actions: knowledge.fallbackActions };
}
