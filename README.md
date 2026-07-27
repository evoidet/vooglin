# Vooglin

Minimal one-page website for Vooglin automation and digital workflow services.

## Preview locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Build

```bash
npm run build
```

The build packages the static page and its social preview image into a deployment-ready worker.

## Edit the content

- Page structure and public copy are in `index.html`.
- Visual styling and responsive layouts are in `styles.css`.
- The current year and mobile navigation are handled in `script.js`.
- The founder section contains a 4:5 portrait placeholder that can be replaced when the final photo is available.
- The Vooglin convergence mark is built in HTML/CSS through the `.brand-symbol` class.
