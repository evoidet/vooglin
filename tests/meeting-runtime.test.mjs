import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { afterEach, test } from "node:test";
import { handleBookingRequest, normaliseBookingPolicy } from "../booking-runtime.mjs";

globalThis.crypto ||= webcrypto;

const originalFetch = globalThis.fetch;
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;
const policy = normaliseBookingPolicy({
  durationMinutes: 30,
  minimumLeadDays: 1,
  maximumDaysAhead: 90,
  preferredTimes: ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"],
});
const environment = Object.freeze({
  SMTP2GO_API_KEY: "api-test-key",
  SMTP2GO_SENDER: "website@vooglin.ee",
  CONTACT_RECEIVER: "owner@vooglin.ee",
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.setTimeout = originalSetTimeout;
  globalThis.clearTimeout = originalClearTimeout;
});

function tallinnDate(daysFromNow) {
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

function validPayload(overrides = {}) {
  const submittedAt = Date.now();
  return {
    submissionId: "123e4567-e89b-42d3-a456-426614174000",
    name: "Test Visitor",
    organisation: "Test Organisation",
    email: "visitor@example.com",
    phone: "",
    message: "Please automate this process.",
    preferredDate: tallinnDate(3),
    preferredTime: "10:00",
    website: "",
    locale: "en",
    durationMinutes: 30,
    formStartedAt: submittedAt - 1000,
    submittedAt,
    ...overrides,
  };
}

function postRequest(body = validPayload(), options = {}) {
  const rawBody = typeof body === "string" ? body : JSON.stringify(body);
  const headers = new Headers({
    "Content-Type": "application/json",
    "Origin": "https://vooglin.ee",
    ...options.headers,
  });

  return new Request(options.url || "https://vooglin.ee/api/meeting", {
    method: "POST",
    headers,
    body: rawBody,
  });
}

function smtp2goResponse(data = {}) {
  return new Response(JSON.stringify({
    request_id: "smtp-request-id",
    data: {
      succeeded: 1,
      failed: 0,
      failures: [],
      email_id: "smtp-email-id",
      ...data,
    },
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("GET requests are rejected with JSON and Allow: POST", async () => {
  const response = await handleBookingRequest(
    new Request("https://vooglin.ee/api/meeting"),
    environment,
    policy,
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "POST");
  assert.match(response.headers.get("Content-Type"), /^application\/json/);
  assert.deepEqual(await response.json(), { ok: false, code: "method_not_allowed" });
});

test("malformed and cross-origin requests are rejected before delivery", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return smtp2goResponse();
  };

  const malformedResponse = await handleBookingRequest(
    postRequest("{not valid json"),
    environment,
    policy,
  );
  const crossOriginResponse = await handleBookingRequest(
    postRequest(validPayload(), { headers: { Origin: "https://example.com" } }),
    environment,
    policy,
  );

  assert.equal(malformedResponse.status, 400);
  assert.equal(crossOriginResponse.status, 403);
  assert.equal(calls, 0);
});

test("chunked request bodies stop reading as soon as the byte limit is exceeded", async () => {
  let pulls = 0;
  let wasCancelled = false;
  const body = new ReadableStream({
    pull(controller) {
      pulls += 1;
      controller.enqueue(new Uint8Array(9000));
    },
    cancel() {
      wasCancelled = true;
    },
  });
  const request = new Request("https://vooglin.ee/api/meeting", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://vooglin.ee",
    },
    body,
    duplex: "half",
  });

  const response = await handleBookingRequest(request, environment, policy);

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { ok: false, code: "invalid_request" });
  assert.equal(wasCancelled, true);
  assert.ok(pulls <= 3, `request should stop promptly, received ${pulls} chunks`);
});

test("required fields, malformed email, locale, and field limits are enforced server-side", async () => {
  const cases = [
    validPayload({ submissionId: "not-a-uuid" }),
    validPayload({ name: "" }),
    validPayload({ email: "not-an-email" }),
    validPayload({ locale: "de" }),
    validPayload({ name: "x".repeat(121) }),
    validPayload({ message: "x".repeat(2001) }),
    validPayload({ preferredTime: "12:34" }),
  ];

  for (const payload of cases) {
    const response = await handleBookingRequest(postRequest(payload), environment, policy);
    assert.equal(response.status, 400);
    assert.equal((await response.json()).ok, false);
  }
});

test("older cached clients without a submission UUID remain compatible", async () => {
  globalThis.fetch = async (...args) => {
    const outbound = JSON.parse(args[1].body);
    assert.match(
      outbound.custom_headers.find(({ header }) => header === "X-Vooglin-Submission-Id")?.value || "",
      /^[0-9a-f-]{36}$/i,
    );
    return smtp2goResponse();
  };
  const payload = validPayload();
  delete payload.submissionId;

  const response = await handleBookingRequest(postRequest(payload), environment, policy);

  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});

test("the honeypot returns a generic success without contacting SMTP2GO", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return smtp2goResponse();
  };

  const response = await handleBookingRequest(
    postRequest(validPayload({ website: "https://spam.example" })),
    {},
    policy,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(calls, 0);
});

test("missing server configuration is reported generically and does not call SMTP2GO", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return smtp2goResponse();
  };

  const response = await handleBookingRequest(postRequest(), {}, policy);
  const rawResponse = await response.text();

  assert.equal(response.status, 503);
  assert.deepEqual(JSON.parse(rawResponse), { ok: false, code: "delivery_not_configured" });
  assert.doesNotMatch(rawResponse, /api-test-key|SMTP2GO/i);
  assert.equal(calls, 0);
});

test("SMTP2GO HTTP errors and API-level rejections never produce a success response", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ data: { error: "rejected" } }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
  const httpFailure = await handleBookingRequest(postRequest(), environment, policy);
  assert.equal(httpFailure.status, 502);
  assert.deepEqual(await httpFailure.json(), { ok: false, code: "delivery_failed" });

  globalThis.fetch = async () => smtp2goResponse({
    succeeded: 0,
    failed: 1,
    failures: ["Message rejected"],
    email_id: "",
  });
  const apiFailure = await handleBookingRequest(postRequest(), environment, policy);
  assert.equal(apiFailure.status, 502);
  assert.deepEqual(await apiFailure.json(), { ok: false, code: "delivery_failed" });

  globalThis.fetch = async () => new Response("{not valid json", {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
  const malformedBody = await handleBookingRequest(postRequest(), environment, policy);
  assert.equal(malformedBody.status, 502);
  assert.deepEqual(await malformedBody.json(), { ok: false, code: "delivery_failed" });
});

test("the SMTP2GO timeout remains active while the response body is parsed", async () => {
  const timerToken = {};
  let timerWasCleared = false;
  globalThis.setTimeout = () => timerToken;
  globalThis.clearTimeout = (token) => {
    assert.equal(token, timerToken);
    timerWasCleared = true;
  };
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      assert.equal(timerWasCleared, false);
      return {
        data: {
          succeeded: 1,
          failed: 0,
          failures: [],
          email_id: "smtp-email-id",
        },
      };
    },
  });

  const response = await handleBookingRequest(postRequest(), environment, policy);

  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(timerWasCleared, true);
});

test("network failures are handled without retrying or exposing details", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    throw new Error("network unavailable and api-test-key must stay private");
  };

  const response = await handleBookingRequest(postRequest(), environment, policy);
  const rawResponse = await response.text();

  assert.equal(response.status, 502);
  assert.equal(calls, 1);
  assert.deepEqual(JSON.parse(rawResponse), { ok: false, code: "delivery_failed" });
  assert.doesNotMatch(rawResponse, /api-test-key|network unavailable/i);
});

test("confirmed success sends exactly one UTF-8 owner notification with Reply-To", async () => {
  const calls = [];
  globalThis.fetch = async (...args) => {
    calls.push(args);
    return smtp2goResponse();
  };

  const response = await handleBookingRequest(postRequest(validPayload({
    name: "Õnne Žukova",
    organisation: "MTÜ Töörõõm",
    email: "Visitor+Web@Example.com",
    phone: "",
    message: "Первая строка\nTeine rida õäöü.",
    locale: "et",
  })), environment, policy);
  const responseBody = await response.json();

  assert.equal(response.status, 200);
  assert.equal(responseBody.ok, true);
  assert.match(responseBody.requestId, /^[0-9a-f-]{36}$/i);
  assert.equal(calls.length, 1);

  const [url, requestOptions] = calls[0];
  assert.equal(String(url), "https://api.smtp2go.com/v3/email/send");
  assert.equal(requestOptions.method, "POST");
  assert.equal(requestOptions.headers["X-Smtp2go-Api-Key"], "api-test-key");

  const outbound = JSON.parse(requestOptions.body);
  assert.equal(outbound.sender, "website@vooglin.ee");
  assert.deepEqual(outbound.to, ["owner@vooglin.ee"]);
  assert.equal(outbound.subject, "Vooglin — uus kohtumispäring");
  assert.deepEqual(outbound.custom_headers, [
    { header: "Reply-To", value: "Visitor+Web@Example.com" },
    { header: "X-Vooglin-Submission-Id", value: "123e4567-e89b-42d3-a456-426614174000" },
  ]);
  assert.equal(Object.hasOwn(outbound, "api_key"), false);
  assert.equal(Object.hasOwn(outbound, "cc"), false);
  assert.equal(Object.hasOwn(outbound, "bcc"), false);
  assert.match(outbound.text_body, /Õnne Žukova/);
  assert.match(outbound.text_body, /MTÜ Töörõõm/);
  assert.match(outbound.text_body, /Telefon:\n-\n/);
  assert.match(outbound.text_body, /Первая строка\nTeine rida õäöü\./);
  assert.match(outbound.text_body, /Saadetud veebilehelt:\nvooglin\.ee$/);
});

test("the generated Sites worker and Vercel function both expose /api/meeting", async () => {
  const [{ default: worker }, { default: vercelFunction }] = await Promise.all([
    import("../dist/server/index.js"),
    import("../api/meeting.js"),
  ]);

  const workerResponse = await worker.fetch(new Request("https://vooglin.ee/api/meeting"), {});
  const vercelResponse = await vercelFunction.fetch(new Request("https://vooglin.ee/api/meeting"));

  assert.equal(workerResponse.status, 405);
  assert.equal(vercelResponse.status, 405);
});
