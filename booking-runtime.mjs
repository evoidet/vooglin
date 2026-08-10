const DEFAULT_BOOKING_POLICY = Object.freeze({
  durationMinutes: 30,
  minimumLeadDays: 1,
  maximumDaysAhead: 90,
  preferredTimes: Object.freeze(["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"]),
});

const SMTP2GO_ENDPOINT = "https://api.smtp2go.com/v3/email/send";
const MAX_REQUEST_BYTES = 16384;
const ALLOWED_LOCALES = new Set(["en", "et", "ru"]);

export function normaliseBookingPolicy(value = {}) {
  const configuredDuration = Math.round(Number(value.durationMinutes));
  const minimumLeadDays = Math.max(0, Math.round(Number(value.minimumLeadDays) || 0));
  const maximumDaysAhead = Math.max(
    minimumLeadDays + 1,
    Math.round(Number(value.maximumDaysAhead) || DEFAULT_BOOKING_POLICY.maximumDaysAhead),
  );
  const preferredTimes = Array.isArray(value.preferredTimes)
    ? value.preferredTimes.filter((time) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time))
    : [];

  return Object.freeze({
    durationMinutes: [15, 30, 45, 60, 90].includes(configuredDuration)
      ? configuredDuration
      : DEFAULT_BOOKING_POLICY.durationMinutes,
    minimumLeadDays,
    maximumDaysAhead,
    preferredTimes: Object.freeze(preferredTimes.length ? preferredTimes : [...DEFAULT_BOOKING_POLICY.preferredTimes]),
  });
}

function bookingJson(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

function normaliseSingleLine(value, maximumLength, required = false) {
  if (typeof value !== "string"
    || value.length > maximumLength
    || /[\0\r\n]/.test(value)) {
    return null;
  }

  const normalised = value.trim().replace(/\s+/g, " ");
  return required && !normalised ? null : normalised;
}

function normaliseMessage(value, maximumLength) {
  if (typeof value !== "string" || value.length > maximumLength || value.includes("\0")) {
    return null;
  }

  const normalised = value.replace(/\r\n?/g, "\n").trim();
  return normalised || null;
}

function isValidEmailAddress(value) {
  if (typeof value !== "string" || value.length > 254 || /[\0\s<>]/.test(value)) return false;

  const atIndex = value.indexOf("@");
  if (atIndex <= 0 || atIndex !== value.lastIndexOf("@")) return false;

  const localPart = value.slice(0, atIndex);
  const domain = value.slice(atIndex + 1);
  if (localPart.length > 64
    || !domain
    || domain.length > 253
    || localPart.startsWith(".")
    || localPart.endsWith(".")
    || localPart.includes("..")
    || !/^[a-z0-9.!#$%&'*+/=?^_{|}~-]+$/i.test(localPart)) {
    return false;
  }

  const labels = domain.split(".");
  return labels.length > 1 && labels.every((label) => (
    label.length >= 1
    && label.length <= 63
    && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label)
  ));
}

function tallinnDateKey(daysFromNow) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Tallinn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day) + daysFromNow,
  )).toISOString().slice(0, 10);
}

function bookingDateEpoch(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return Number.NaN;
  const [year, month, day] = value.split("-").map(Number);
  const epoch = Date.UTC(year, month - 1, day);
  const date = new Date(epoch);
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    ? epoch
    : Number.NaN;
}

function validateBookingRequest(body, bookingPolicy) {
  const name = normaliseSingleLine(body.name, 120, true);
  const organisation = normaliseSingleLine(body.organisation, 120, true);
  const email = normaliseSingleLine(body.email, 254, true);
  const phone = normaliseSingleLine(body.phone, 40);
  const message = normaliseMessage(body.message, 2000);
  const preferredDate = normaliseSingleLine(body.preferredDate, 10, true);
  const preferredTime = normaliseSingleLine(body.preferredTime, 5, true);
  const locale = normaliseSingleLine(body.locale, 5, true);

  if (name === null
    || organisation === null
    || email === null
    || phone === null
    || message === null
    || preferredDate === null
    || preferredTime === null
    || locale === null) {
    return null;
  }

  const booking = {
    name,
    organisation,
    email,
    phone,
    message,
    preferredDate,
    preferredTime,
    locale,
    durationMinutes: bookingPolicy.durationMinutes,
  };
  const emailIsValid = isValidEmailAddress(booking.email);
  const localeIsValid = ALLOWED_LOCALES.has(booking.locale);
  const timeIsValid = bookingPolicy.preferredTimes.includes(booking.preferredTime);
  const requestedDate = bookingDateEpoch(booking.preferredDate);
  const earliestDate = bookingDateEpoch(tallinnDateKey(bookingPolicy.minimumLeadDays));
  const latestDate = bookingDateEpoch(tallinnDateKey(bookingPolicy.maximumDaysAhead));
  const dateInRange = Number.isFinite(requestedDate)
    && requestedDate >= earliestDate
    && requestedDate <= latestDate;

  if (!emailIsValid || !localeIsValid || !timeIsValid || !dateInRange) {
    return null;
  }

  return booking;
}

function deliveryConfiguration(env) {
  const apiKey = typeof env?.SMTP2GO_API_KEY === "string" ? env.SMTP2GO_API_KEY.trim() : "";
  const sender = typeof env?.SMTP2GO_SENDER === "string" ? env.SMTP2GO_SENDER.trim() : "";
  const receiver = typeof env?.CONTACT_RECEIVER === "string" ? env.CONTACT_RECEIVER.trim() : "";

  if (!apiKey
    || apiKey.length > 512
    || /[\0\r\n]/.test(apiKey)
    || !isValidEmailAddress(sender)
    || !isValidEmailAddress(receiver)) {
    return null;
  }

  return { apiKey, sender, receiver };
}

function bookingEmailBody(booking) {
  return [
    "VOOGLIN — UUS KOHTUMISPÄRING",
    "",
    "Nimi:",
    booking.name,
    "",
    "Ettevõte / organisatsioon:",
    booking.organisation || "-",
    "",
    "E-post:",
    booking.email,
    "",
    "Telefon:",
    booking.phone || "-",
    "",
    "Mida soovite automatiseerida?",
    booking.message,
    "",
    "Soovitud kuupäev:",
    booking.preferredDate,
    "",
    "Soovitud kellaaeg:",
    `${booking.preferredTime} (Europe/Tallinn)`,
    "",
    "Saadetud veebilehelt:",
    "vooglin.ee",
  ].join("\n");
}

export async function handleBookingRequest(request, env, policy = DEFAULT_BOOKING_POLICY) {
  const bookingPolicy = normaliseBookingPolicy(policy);

  if (request.method !== "POST") {
    return bookingJson({ ok: false, code: "method_not_allowed" }, 405, { Allow: "POST" });
  }

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (!origin) return bookingJson({ ok: false, code: "origin_not_allowed" }, 403);
  try {
    if (new URL(origin).origin !== requestUrl.origin) {
      return bookingJson({ ok: false, code: "origin_not_allowed" }, 403);
    }
  } catch {
    return bookingJson({ ok: false, code: "origin_not_allowed" }, 403);
  }

  const contentType = request.headers.get("Content-Type") || "";
  const contentLengthHeader = request.headers.get("Content-Length");
  const contentLength = contentLengthHeader === null ? 0 : Number(contentLengthHeader);
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)
    || !Number.isFinite(contentLength)
    || contentLength < 0
    || contentLength > MAX_REQUEST_BYTES) {
    return bookingJson({ ok: false, code: "invalid_request" }, 400);
  }

  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    return bookingJson({ ok: false, code: "invalid_json" }, 400);
  }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    return bookingJson({ ok: false, code: "invalid_request" }, 400);
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return bookingJson({ ok: false, code: "invalid_json" }, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return bookingJson({ ok: false, code: "invalid_request" }, 400);
  }

  if (typeof body.website !== "string") {
    return bookingJson({ ok: false, code: "invalid_request" }, 400);
  }
  if (body.website.length > 200 || body.website.trim()) {
    return bookingJson({ ok: true });
  }

  const formStartedAt = Number(body.formStartedAt);
  const submittedAt = Number(body.submittedAt);
  const formAge = submittedAt - formStartedAt;
  if (!Number.isFinite(formStartedAt)
    || !Number.isFinite(submittedAt)
    || formAge < 600
    || formAge > 7200000) {
    return bookingJson({ ok: false, code: "invalid_request" }, 400);
  }

  const booking = validateBookingRequest(body, bookingPolicy);
  if (!booking) return bookingJson({ ok: false, code: "validation_failed" }, 400);

  const configuration = deliveryConfiguration(env);
  if (!configuration) {
    return bookingJson({ ok: false, code: "delivery_not_configured" }, 503);
  }

  const requestId = crypto.randomUUID();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let deliveryResponse;
  let deliveryResult;

  try {
    deliveryResponse = await fetch(SMTP2GO_ENDPOINT, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json; charset=utf-8",
        "X-Smtp2go-Api-Key": configuration.apiKey,
      },
      body: JSON.stringify({
        sender: configuration.sender,
        to: [configuration.receiver],
        subject: "Vooglin — uus kohtumispäring",
        text_body: bookingEmailBody(booking),
        custom_headers: [
          { header: "Reply-To", value: booking.email },
        ],
      }),
      signal: controller.signal,
    });
    if (!deliveryResponse.ok) {
      return bookingJson({ ok: false, code: "delivery_failed" }, 502);
    }
    deliveryResult = await deliveryResponse.json();
  } catch {
    return bookingJson({ ok: false, code: "delivery_failed" }, 502);
  } finally {
    clearTimeout(timeout);
  }

  const deliveryData = deliveryResult?.data;
  const wasAccepted = deliveryData?.succeeded === 1
    && deliveryData?.failed === 0
    && Array.isArray(deliveryData?.failures)
    && deliveryData.failures.length === 0
    && typeof deliveryData?.email_id === "string"
    && deliveryData.email_id.trim().length > 0;

  if (!wasAccepted) {
    return bookingJson({ ok: false, code: "delivery_failed" }, 502);
  }

  return bookingJson({ ok: true, requestId });
}
