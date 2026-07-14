# Vooglin

Animated one-page website for Vooglin automation and digital workflow services.

## Preview locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Edit the content

- Company name and contact email are in `siteConfig` at the top of `script.js`.
- Every main service chapter is stored in the `services` array directly below it.
- Reorder, add, or remove service objects to update both the content and scroll journey.
- Hero, approach, additional-services, contact, and footer copy are in `index.html`.

Each service object controls its public copy, example outcomes, visual type, planet colours, rings, layout, entrance direction, exit direction, and camera scale.

## Motion and performance

- Scroll position directly controls the planet and text timelines; there is no automatic slideshow.
- Mobile keeps the full story with smaller planets and fewer background layers.
- Canvas density and ambient particle counts are capped by viewport size.
- `prefers-reduced-motion` removes non-essential movement while preserving all content.
