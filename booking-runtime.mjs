const DEFAULT_BOOKING_POLICY = Object.freeze({
  durationMinutes: 30,
  minimumLeadDays: 1,
  maximumDaysAhead: 90,
  preferredTimes: Object.freeze(["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"]),
});

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

function normaliseBookingText(value, maximumLength) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maximumLength);
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
  const booking = {
    name: normaliseBookingText(body.name, 120),
    organisation: normaliseBookingText(body.organisation, 120),
    email: normaliseBookingText(body.email, 254).toLowerCase(),
    phone: normaliseBookingText(body.phone, 40),
    message: normaliseBookingText(body.message, 2000),
    preferredDate: normaliseBookingText(body.preferredDate, 10),
    preferredTime: normaliseBookingText(body.preferredTime, 5),
    locale: normaliseBookingText(body.locale, 5),
    sourcePage: normaliseBookingText(body.sourcePage, 500),
    durationMinutes: bookingPolicy.durationMinutes,
  };
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email);
  const timeIsValid = bookingPolicy.preferredTimes.includes(booking.preferredTime);
  const requestedDate = bookingDateEpoch(booking.preferredDate);
  const earliestDate = bookingDateEpoch(tallinnDateKey(bookingPolicy.minimumLeadDays));
  const latestDate = bookingDateEpoch(tallinnDateKey(bookingPolicy.maximumDaysAhead));
  const dateInRange = Number.isFinite(requestedDate)
    && requestedDate >= earliestDate
    && requestedDate <= latestDate;

  if (!booking.name || !booking.organisation || !booking.message || !emailIsValid || !timeIsValid || !dateInRange) {
    return null;
  }

  return booking;
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
    if (new URL(origin).host !== requestUrl.host) {
      return bookingJson({ ok: false, code: "origin_not_allowed" }, 403);
    }
  } catch {
    return bookingJson({ ok: false, code: "origin_not_allowed" }, 403);
  }

  const contentType = request.headers.get("Content-Type") || "";
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (!contentType.toLowerCase().startsWith("application/json") || contentLength > 16384) {
    return bookingJson({ ok: false, code: "invalid_request" }, 400);
  }

  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    return bookingJson({ ok: false, code: "invalid_json" }, 400);
  }
  if (new TextEncoder().encode(rawBody).byteLength > 16384) {
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

  if (normaliseBookingText(body.website, 200)) {
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

  const webhookValue = typeof env?.BOOKING_WEBHOOK_URL === "string" ? env.BOOKING_WEBHOOK_URL : "";
  let webhookUrl;
  try {
    webhookUrl = new URL(webhookValue);
  } catch {
    return bookingJson({ ok: false, code: "delivery_not_configured" }, 503);
  }
  if (webhookUrl.protocol !== "https:") {
    return bookingJson({ ok: false, code: "delivery_not_configured" }, 503);
  }

  const requestId = crypto.randomUUID();
  const webhookHeaders = {
    "Content-Type": "application/json",
    "X-Vooglin-Request-Id": requestId,
  };
  if (typeof env?.BOOKING_WEBHOOK_TOKEN === "string" && env.BOOKING_WEBHOOK_TOKEN) {
    webhookHeaders.Authorization = "Bearer " + env.BOOKING_WEBHOOK_TOKEN;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let deliveryResponse;

  try {
    deliveryResponse = await fetch(webhookUrl.href, {
      method: "POST",
      headers: webhookHeaders,
      body: JSON.stringify({
        event: "vooglin.booking_request",
        requestId,
        receivedAt: new Date().toISOString(),
        recipient: typeof env?.BOOKING_RECIPIENT_EMAIL === "string" && env.BOOKING_RECIPIENT_EMAIL
          ? env.BOOKING_RECIPIENT_EMAIL
          : "egor@vooglin.ee",
        contact: {
          name: booking.name,
          organisation: booking.organisation,
          email: booking.email,
          phone: booking.phone,
        },
        meeting: {
          preferredDate: booking.preferredDate,
          preferredTime: booking.preferredTime,
          timezone: "Europe/Tallinn",
          durationMinutes: booking.durationMinutes,
        },
        request: booking.message,
        context: {
          locale: booking.locale,
          sourcePage: booking.sourcePage,
        },
      }),
      signal: controller.signal,
    });
  } catch {
    return bookingJson({ ok: false, code: "delivery_failed" }, 502);
  } finally {
    clearTimeout(timeout);
  }

  if (!deliveryResponse.ok) {
    return bookingJson({ ok: false, code: "delivery_failed" }, 502);
  }

  return bookingJson({ ok: true, requestId });
}
