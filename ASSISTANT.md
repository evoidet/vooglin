# Vooglin website helper

The clickable robot in the header is a second companion. The original decorative
`.robot-perch` SVG, its placement, `styles.css`, and `script.js` are unchanged.

## Files and content

- `assistant.mjs`: separate SVG, launcher, panel, messages, links, session preferences,
  keyboard behavior and collision-aware positioning.
- `assistant.css`: scoped `site-assistant-*` styles, responsive layout and reduced motion.
- `assistant-intents.mjs`: Unicode normalization, aliases, scoring and conservative routing
  for English, Estonian and Russian. It performs no network requests.
- `assistant-knowledge.mjs`: build-time extraction from the actual localized home,
  pricing and privacy HTML. Missing required source sections fail the build.
- `localize.mjs`: the existing translation dictionary also supplies the helper UI.
- `build-site.mjs`: writes `assistant-en.json`, `assistant-et.json`, `assistant-ru.json`
  and the browser modules to `public`, and packages identical assets in the existing worker.
- `tests/assistant.test.mjs`: multilingual questions, unknown topics, source fidelity,
  policy qualifications, routes, localization and static-asset serving.

Edit the public page content and its existing translations, then run `npm test`.
Do not edit generated JSON. When changing section structure, update the extraction
selectors and tests together. Add new question aliases to the intent module; add UI
copy to the existing `localize.mjs` common dictionaries. Keep the asset version in
the HTML/module URLs consistent when releasing a changed browser module or schema.

## Behavior and limits

The helper covers services, about/location, the process, project pricing approach,
software costs, ongoing support, the time-savings calculator, contact, consultation
requests, current-page context and published privacy topics. Legal details are
extracted verbatim with their qualifications and links to the full policy.

Unpublished information such as news, a project portfolio, terms, exact project
prices, phone numbers and delivery dates gets a fallback with useful page links.
This is deterministic matching, not generative AI; unfamiliar wording can miss.

Questions stay in tab memory (a maximum of 40 message entries) and are rendered as
text. There are no assistant API calls, secrets, dependencies or paid services.
Only greeting and open/closed preferences use sessionStorage. The brief greeting
is attempted once per session, only where it will not cover important content.
The panel closes for navigation, the mobile menu, the booking dialog, Escape, or
interaction outside it. It restores an intentionally open panel on reload without
stealing focus. The existing consultation dialog still handles meeting requests.

The launcher occupies its own header cell. The open panel avoids the original pet,
tracks the visual viewport, and uses a compact layout when the keyboard reduces
available space. If less than 210px remains without covering the original robot,
it minimizes. Reduced motion disables the new robot's blink, nod and hover movement.

## Local verification (14 September 2026)

- `npm test`: build, syntax checks and all 31 tests pass; no separate lint script exists.
- Browser: all nine pages at 1440, 1024, 768, 390 and 320px widths fit the viewport;
  launcher/header and assistant/original-robot collision checks pass.
- Checked EN/ET/RU answers, Enter/Send, Escape/focus, menu interaction, policy details,
  section links, consultation links across pages, session greeting and literal input rendering.
- Checked a 390 × 430 viewport for keyboard space. Physical phone keyboards and
  assistive technologies were not available for device-level testing.
- Compared the three original robot blocks and existing CSS/JS with the pre-change
  baseline; all are unchanged. No website was deployed or published.
