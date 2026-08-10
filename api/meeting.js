import { webcrypto } from "node:crypto";
import { handleBookingRequest, normaliseBookingPolicy } from "../booking-runtime.mjs";

globalThis.crypto ||= webcrypto;
globalThis.window ||= {};
await import("../site-config.js");

const bookingPolicy = normaliseBookingPolicy(globalThis.window.vooglinSiteConfig?.booking);

export default {
  async fetch(request) {
    return handleBookingRequest(request, process.env, bookingPolicy);
  },
};
