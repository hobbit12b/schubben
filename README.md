# Schubben geven

Educatief telspel voor groep 1–2, gebouwd met HTML, CSS en JavaScript zonder framework of buildstap. `CODEX.md` is de functionele specificatie; aanvullende gebruikersinstructies voegen losse staarten, een vrijstaande schelp, gesproken uitleg en overlappende vertrek- en schubanimaties toe.

## Starten

Open `index.html` in een moderne browser, of voer `node server.cjs` uit en open `http://127.0.0.1:4173`. De statische spelbestanden kunnen ook rechtstreeks op een webserver worden geplaatst. Er zijn geen externe netwerkafhankelijkheden of accounts.

Kies een aanbiedingsvorm en niveau. Tik op de schelp om toe te voegen, op een visje om de laatst toegevoegde vis terug te sturen en op Regenboog om het antwoord te controleren.

## Opbouw

- `index.html`: instellingen, speelveld en toegankelijke knoppen.
- `css/style.css`: proportioneel 4:3-speelveld, vaste beeldlagen, spriteweergave en schelpbeloning.
- `js/game.js`: centrale state, geschud getallendeck, expliciete slotrichtingen, LIFO, sequentiële telanimaties en Nederlandse spraak.
- `assets/approved/`: losse WebP-bestanden, inclusief vier lichamen en vier staarten; het compositievoorbeeld wordt uitsluitend als ontwerpvoorbeeld gebruikt.
- `server.cjs`: optionele lokale previewserver.
- `tests/browser.cjs`: browsertests met Playwright en Edge; spraak wordt gesimuleerd zodat exacte teksten, taal en tempo controleerbaar zijn.

De kleine visjes bestaan elk uit twee transparante afbeeldingen: een lichaam zonder staart en een losse staart, in geel, turquoise, roze en paars. Alleen de staart zwaait via CSS om het aanhechtingspunt. Bij verminderde beweging staat de staart stil. De clownvis wordt niet gebruikt. Visjes behouden hun horizontale positie en richting; bij vertrek worden ze alleen verticaal gespiegeld en zakken ze achter de voorgrond. Home annuleert spraak, timers en animaties; een sessienummer voorkomt dat oude asynchrone acties een nieuw spel beïnvloeden.

## Aanbiedingsvormen

Visueel toont het doelgetal; tikken op het getal spreekt alleen dat getal uit. Dit werkt ook met Enter of de spatiebalk. Auditief spreekt de opdracht zonder een zichtbaar getal. Visueel + auditief combineert beide. Alleen de twee audiomodi hebben gesproken telwoorden, feedback en een luidsprekerknop. Spraak gebruikt `speechSynthesis`, `nl-NL` en tempo `0.82`. De Nederlandse stem en geluidsuitvoer zijn afhankelijk van het apparaat. Zonder spraakondersteuning zijn de audiomodi uitgeschakeld met een melding op het instellingenscherm.

## Uitleg en animatie

De eerste start na het openen spreekt: “Druk op Regenboog als er genoeg visjes in beeld staan.” Ook in de visuele modus klinkt deze uitleg één keer. Het speelveld bevat geen geschreven uitleg. De instellingen zijn bedoeld voor de leerkracht.

De ogen van de gele vis zijn wit met zwarte pupillen. De schubvlucht duurt 520 ms voor een rustig zichtbaar traject, terwijl het vertrek van de vorige vis blijft overlappen.

Na een fout antwoord kijkt Regenboog kort sip en schudt hij rustig “nee”. Daarna keert het gewone gezicht terug en blijft dezelfde opdracht staan. Bij verminderde beweging verschijnt alleen het sippe gezicht.

De sippe mond en wenkbrauwen liggen over het oorspronkelijke artwork, zodat het lichaam niet verspringt. De nee-beweging is klein en vloeiend. Na het landen van een schub duurt de pauze 60 ms; telspraak mag tijdens vertrek afklinken. Visjes draaien in 160 ms vloeiend door twee zijstanden voordat ze dalen. Bij niveau 1–10 zijn de visjes 10% kleiner. Een contactschaduw laat de losse schelp op de stenen rusten.

Na acht seconden zonder bediening krijgt de beschikbare schelp een zachte gloed. Een handeling stopt de aanwijzing; tijdens nakijken is deze uitgeschakeld. Visjes deinen heel licht op hun vaste plek. De schub landt op het lichaam, boven de zijvin. De volgende schub vliegt al terwijl de vorige vis vertrekt; de telwoorden blijven na elkaar klinken. Bij niveau 1–10 staan Regenboog en zijn gedachtewolk hoger.

`assets/approved/shell-closed.webp` en `shell-open.webp` zijn twee passende, losstaande schelpen vanuit dezelfde camerahoek, zonder aangehechte stenen. De open versie bevat één parel. De bronatlas en ImageGen-prompts staan in `assets/reference/`; de exportscripts in `tools/`.

Het corrupte ZIP-bestand wordt nergens geladen. Er is niets overgenomen uit een oude repository.

## Tests uitvoeren

Met Playwright beschikbaar en Microsoft Edge geïnstalleerd: `node tests/browser.cjs`. Gebruik zo nodig `NODE_PATH` om naar een bestaande Playwright-installatie te verwijzen. De tests starten zelf een tijdelijke lokale server en slaan screenshots en resultaten op in `tests/artifacts/`. Met een geïnstalleerde Playwright-WebKit kan dezelfde suite via de omgevingsvariabele `TEST_BROWSER=webkit` worden uitgevoerd.

Zie `TESTING.md` voor de uitgevoerde controles en apparaatbeperkingen.
