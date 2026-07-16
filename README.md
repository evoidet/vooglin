# Vooglin

Animated one-page website for Vooglin automation and digital workflow services.

## Preview locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Edit the content

- Company name and contact email are in `siteConfig` at the top of `script.js`.
- Every main service chapter is stored in the `services` array directly below it, including its practical subtitle, example outcomes, technical code, and URL hash.
- Reorder, add, or remove service objects to update both the content and scroll journey.
- Hero, approach, additional-services, contact, and footer copy are in `index.html`.
- The complete clickable service directory is also in `index.html`; its main links use each service object's `hash` value to open a stable, readable point in the journey.

Each service object controls its public copy, example outcomes, visual type, layout, entrance direction, exit direction, and camera scale.

## Planet artwork

- The journey planets are original AI-generated concept renders made for this site. They are scientifically inspired fictional worlds, not photographs of real named planets.
- Responsive transparent WebP variants live in `assets/planets/` at 1254, 1024, 768, and 320 pixels.
- The page loads a responsive full render for the current world and a 320px preview for the incoming world; the next full render is primed for a clean handoff.

## Sun artwork

- The hero and journey share one original AI-generated, astrophotography-inspired Sun cutout created for this site.
- Transparent responsive WebP variants live in `assets/sun/` at 1254, 768, 480, and 256 pixels; CSS adds only a lightweight corona and slow surface drift.

## Motion and performance

- Scroll position directly controls the planet and text timelines; there is no automatic slideshow.
- Each chapter renders one detailed active planet and, only during handoff, one low-detail incoming planet so the journey never drops to an empty black frame.
- A shared smootherstep/power easing timeline coordinates the distant approach, stable reading window, staged service-copy reveal, accelerating departure, and early arrival of the next world.
- Seven lightweight SVG orbit paths create the perspective system; front arc segments provide depth without expensive 3D rendering.
- Select worlds reuse lightweight CSS rings, moons, satellites, and data trails to add variety without loading more planet textures.
- Mobile keeps the full story with smaller planets and fewer background layers.
- Canvas density and ambient particle counts are capped by viewport size.
- Initial quality is selected from device capability, DPR is capped per device class, and repeated slow frames step the experience from high to balanced to performance mode without reloading.
- Upcoming planet renders are requested and decoded before chapter handoff; only the current detailed world, its outgoing state, and one small 320px incoming preview are present in the visible journey.
- Section animations pause while their region is offscreen, and the canvas loop pauses while the document is hidden.
- `prefers-reduced-motion` removes non-essential movement while preserving all content.
