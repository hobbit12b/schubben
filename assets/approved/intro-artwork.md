# Intro artwork

The intro uses `intro-eye-source.webp` and `intro-ear-complete.webp`, encoded as WebP from the built-in ImageGen artwork. The eye is displayed in a rectangular CSS window with room for its entire outline; the new standalone ear uses `background-size: contain`. Number clouds and sound indicators are native UI elements. No generated words are needed.

Every mode and level choice speaks a Dutch explanation through the browser speech synthesizer, directly from the tap gesture. Repeated taps repeat the explanation. New selections and starting the game cancel the previous explanation. All three modes and all four levels remain directly available on the intro.

Final ear prompt (built-in ImageGen):
"One isolated complete human EAR symbol for a preschool underwater game. Recognizable warm peach and gold ear, full outer rim, inner folds, rounded glossy hand-painted storybook shading, deep blue contour, a few soft sparkling highlights. Centered on a perfectly solid pale cream #fff3d9 opaque background, square composition, generous 15 percent margins on all sides. No sound waves, no other objects, no fish, no labels, no text, no frame. Entire ear fully visible and not cropped. Friendly polished painted game asset, not flat vector, not photoreal."

Eye source: existing glossy blue eye from the ImageGen looking illustration. Original reference: `rainbow.webp`. Final background prompt: "Precise background edit. Replace ALL of the gray checkerboard background with a perfectly solid very pale icy blue background color #e5f7ff. This is an opaque finished illustration, NOT transparent. Keep the eye, rainbow fish, thought cloud and exact digit 3 unchanged in design, position, color, size. No checkerboard anywhere. Keep complete original landscape composition."

Validation: `tests/start-screen.cjs` checks the three choice controls, spoken-number previews, visual-mode silence, viewport fit and starting all three game modes. Screenshot reviewed at 1024 × 768.
