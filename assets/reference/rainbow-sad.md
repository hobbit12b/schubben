Gemaakt met de ingebouwde ImageGen-tool. Bron: `rainbow-sad.png`. De export `node tools/export-rainbow-sad.cjs` maakt `assets/approved/rainbow-sad.webp`.

Alleen mond en wenkbrauwen worden in het spel zichtbaar over het oorspronkelijke artwork gelegd, zodat het lichaam niet verspringt. `rainbow-sad-mouth.png` is een extra gegenereerde mondpatch zonder wang/kincontour.

## Mondpatch-prompt

Use case: precise-object-edit. This is a cropped close-up of a blue fish mouth. Create a REPLACEMENT MOUTH PATCH in the same blue painted texture. Replace the open smiling red mouth with ONE small closed downturned dark-blue mouth line, a gentle sad frown, located around horizontal center and 40% down the image. REMOVE the red mouth, tongue and open smile completely, filling that area with matching smooth cyan-blue face skin. CRITICAL: remove the dark blue diagonal cheek-to-chin outline at the right/bottom edge; extend the matching cyan-blue skin all the way to every image edge. The entire rectangular patch is opaque blue skin except the single short sad mouth line and subtle yellow lip glow. No outline along the border, no other lines, no head silhouette, no eyes, no background, no transparency. Preserve the top-left blue color and gentle painted shading. Landscape close-up, same 570x450 proportions as input.

## Prompt

Use case: precise-object-edit. Edit this exact rainbow fish game sprite into a gently SAD expression. Preserve the exact square canvas, fish position and silhouette, pose, colors, all scales and fins, all lighting and every eye position. Change ONLY its smiling mouth into a small closed downturned mouth, and eyebrows into a slightly sad expression. The fish is mildly disappointed and kind, not angry, scary or crying. No tears, no symbols, no text. Keep BOTH eyes fully opaque white around the pupils. No body or head movement in the image; animation is done in code. Use a plain solid neutral gray production background #808080 for clean removal, no checkerboard. Exact same framing and proportions as reference, no cropping, no additional objects.
