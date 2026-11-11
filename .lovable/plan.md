# More realistic, brighter Earth and better-looking 3D icons

## What you'll see
- **A brighter, true-colour Earth.** The daytime side looks like a satellite photo: blue oceans, green and brown land, white ice. Today the land looks almost black because the grey country overlay and heavy shading darken it. The night side keeps its city lights but is less pitch black.
- **More realistic details:**
  - Sunlight glints softly off the oceans, so seas look wet and land looks matt.
  - Mountains and terrain get gentle relief shading.
  - The air around the edge gets a thin blue haze, like photos from space.
  - Clouds look slightly softer and brighter.
- **Sharper on desktop.** A higher-detail Earth picture (NASA Blue Marble, free to use) loads on big screens. Phones keep the current lighter picture so they stay fast.
- **Country colours stay readable.** Warning and statistic colours still show, but as a lighter tint and outline, so the real Earth shows through underneath.
- **Better 3D icons, same colours.** The riot, protest, warning, boat, plane, camera and earthquake markers keep the same colours and meanings. They get:
  - smoother, rounded shapes instead of blocky ones;
  - a soft sheen and gentle edge lighting;
  - a faint glow ring at the base, so they stand out against the brighter Earth.

Nothing else changes: same layers, options, buttons and data.

## Technical details
- `EarthGlobe.tsx` day/night shader: raise day brightness (`0.85 + 0.3*d`), wider twilight band, night ambient `dt*0.18`. Add ocean specular from a water mask (blue-dominance in day texture), a Fresnel rim and a light terrain bump from texture luminance. Texture anisotropy uses the renderer max.
- Desktop (not coarse pointer, `gen === 0`): load `earth-blue-marble-8k.jpg` (NASA Visible Earth, public domain, compressed to about 2-3 MB). Otherwise keep the 4K texture. Light mode stays 4K.
- Polygon caps: default/unchecked fill drops from `rgba(140,140,140,0.35)` to about 0.06 alpha. Advice/stat fills render at reduced alpha, with stronger outlines on coloured countries. Selected and hotspot colours unchanged.
- Icons (`makeIcon`, `makeBoat`): replace flatShading/low-segment geometry with smooth higher-segment geometry (cylinders 16-24 segments, icosahedron detail 2, bevelled extrudes). Use MeshStandardMaterial with roughness ~0.4, metalness ~0.2 and the same hex colours, plus a small additive base halo sprite. Geometries and materials are shared and cached per kind to keep draw cost flat.
- Lighting: add a soft hemisphere and key light to the globe scene so icons are lit consistently. The broadcast/OBS layout gets the same look automatically.
- Check desktop, phone and light-mode fallback screenshots in the preview. Nothing published.
