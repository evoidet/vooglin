/*
 * Public homepage data.
 *
 * Keep social proof factual: add a client only after it can be publicly
 * verified. Booking times are preferences, not live availability.
 */
window.vooglinSiteConfig = Object.freeze({
  clients: Object.freeze([
    Object.freeze({
      verified: true,
      name: "MTÜ Noortealgatuste Tugi",
      website: "https://noortetugi.ee/",
      logo: "/images/partners/noortealgatuste-tugi-logo.png",
      captionLabel: Object.freeze({
        en: "Client",
        et: "Klient",
        ru: "Клиент",
      }),
      linkLabel: Object.freeze({
        en: "Visit the MTÜ Noortealgatuste Tugi website",
        et: "Külasta MTÜ Noortealgatuste Tugi veebilehte",
        ru: "Перейти на сайт MTÜ Noortealgatuste Tugi",
      }),
      actionLabel: Object.freeze({
        en: "View organisation →",
        et: "Vaata organisatsiooni →",
        ru: "Открыть сайт →",
      }),
    }),
  ]),
  // Future approved portraits: { approved: true, name, role: { en, et, ru }, image: "/images/people/file.webp" }
  people: Object.freeze([]),
  booking: Object.freeze({
    endpoint: "/api/meeting",
    recipient: "egor@vooglin.ee",
    durationMinutes: 30,
    minimumLeadDays: 1,
    maximumDaysAhead: 90,
    preferredTimes: Object.freeze([
      "09:00",
      "10:00",
      "11:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
    ]),
    emailCopy: Object.freeze({
      subject: Object.freeze({
        en: "Meeting request",
        et: "Kohtumispäring",
        ru: "Запрос на встречу",
      }),
      name: Object.freeze({ en: "Name", et: "Nimi", ru: "Имя" }),
      organisation: Object.freeze({ en: "Organisation", et: "Organisatsioon", ru: "Организация" }),
      email: Object.freeze({ en: "Email", et: "E-post", ru: "Электронная почта" }),
      phone: Object.freeze({ en: "Phone", et: "Telefon", ru: "Телефон" }),
      date: Object.freeze({ en: "Preferred date", et: "Sobiv kuupäev", ru: "Желаемая дата" }),
      time: Object.freeze({ en: "Preferred time", et: "Sobiv kellaaeg", ru: "Желаемое время" }),
      request: Object.freeze({ en: "What they would like to automate", et: "Mida soovitakse automatiseerida", ru: "Что требуется автоматизировать" }),
    }),
  }),
});
