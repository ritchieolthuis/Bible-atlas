# Hotspot anchor verification — the method that actually works

Geometrie-analyse alleen (puntenwolk-scans van de GLB) is NIET betrouwbaar
genoeg om te bevestigen dat een hotspot goed staat. Een coördinaat kan prima
"op geometrie landen" en toch op het verkeerde onderdeel staan (bv. op de
kroonlijst in plaats van op de pilaar eronder) — dat verschil is met alleen
puntenwolk-dichtheid niet te zien.

**De methode die wél werkt:** live screenshotten via Playwright in
niet-headless (`headless: false`) modus, met alle hotspot-pins gelabeld en
gemarkeerd op het scherm, en dat beeld dan echt bekijken.

## Waarom headless niet werkt
Headless Chromium throttlet `requestAnimationFrame` extreem (rond de 2fps
i.p.v. 60fps) wanneer de pagina niet "echt zichtbaar" is. De hotspot-pins
worden gepositioneerd via een rAF-loop (`engine.onFrame` in
`src/three/engine.ts`), dus in headless-modus blijven ze op hun CSS-initiële
positie hangen (linkerbovenhoek van het canvas) — dat lijkt een bug maar is
puur een artefact van headless throttling. `headless: false` lost dit op.

## Praktisch recept
1. Start de dev server (`npm run dev -- --port 3000`), draai 'm gewoon door.
2. Playwright-script, `headless: false`, viewport 1400x1000.
3. Navigeer naar `/the3d-bible/`, klik de juiste kaart in de structuur-bibliotheek
   (selector: `page.locator('aside, [class*="library"]').first().getByText(naam)`).
4. Wacht tot "Bezig met laden" verdwijnt (grote modellen kunnen 20+ sec duren).
5. Wacht nog ~5-6s extra (camera-easing, marker-fade-in).
6. Injecteer via `page.evaluate` een groene cirkel + tekstlabel op de
   `getBoundingClientRect()` van elk `.hs-pin[data-hs="..."]` element.
7. Screenshot, en LEES het (Read tool op de PNG) — vergelijk elke gelabelde
   pin met het zichtbare 3D-onderdeel eronder.
8. Fix fout gevonden coördinaten met `node tools/fix-anchors.cjs <structuur> id=x,y,z`,
   herhaal de screenshot om te bevestigen.

Een werkend voorbeeldscript staat (of stond) als `tools/_all_pins.cjs` in de
projectroot tijdens de sessie waarin dit is uitgevogeld — het is een
tijdelijk hulpscript, dus het kan zijn opgeruimd; reconstrueer het met
bovenstaand recept als het er niet meer is.

## Wat NIET werkt
- Pixel-schattingen "uit het hoofd" op basis van een eerder screenshot: de
  canvas-layout varieert tussen loads (dev-paneel wel/niet in beeld, drawer
  wel/niet zichtbaar) — reken nooit met vaste pixel-coördinaten van een
  andere run, meet opnieuw.
- Alleen de audit-tool (`tools/audit-hotspots.cjs`) vertrouwen: die checkt
  alleen "landt de coördinaat op een oppervlak", niet "is dit het juiste
  onderdeel". Nuttig als eerste filter, niet als eindcontrole.
