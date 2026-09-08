# Controles

De tests gebruiken Playwright met Microsoft Edge, met een speelveld van 1024 × 768 en touchbediening.

- `node tests/assets.cjs`: de witte delen van beide gele ogen zijn dekkend en neutraal wit, de achtergrond blijft transparant, beide schelpstaten gebruiken hetzelfde transparante canvas. Vereist `sharp`.

- `node tests/layout.cjs`: alle vier niveaus; gezichten blijven zichtbaar vóór het water en achter de voorgrond waar bedoeld. Screenshots visueel gecontroleerd.
- `node tests/interactions.cjs`: opnieuw laden na een ontbrekend staartbestand, kijkrichting van Regenboog, één vliegende schub, Home annuleert lopende acties, geen scroll.
- `node tests/browser.cjs`: drie aanbiedingsvormen × vier niveaus, vaste slots en richtingen, maximum aantal, LIFO, goed/fout antwoord, sequentieel tellen, beloning, getallendeck en schermverhoudingen. Getaluitspraak via tik, Enter en spatie; losse bewegende staart met stil lichaam; verminderde beweging en geblokkeerde getalknop tijdens controle.
- `node tests/guidance.cjs`: eenmalige gesproken beginuitleg, aanwijzing na acht seconden en reset bij bediening, licht deinen en verminderde beweging, extra ruimte bij niveau 1–10, overlap tussen vertrek en volgende schubvlucht, annuleren van beide via Home en geen geschreven uitleg in het speelveld.
- De guidance-test controleert ook het sippe gezicht en de nee-beweging na een fout antwoord, dezelfde opdracht bij opnieuw proberen, herstel van het gewone gezicht en annulering via Home.
- `node tests/tempo.cjs`: telwoorden van 900 ms klinken volledig en na elkaar, terwijl het visje al draait en vertrekt.

Spraak wordt in de functionele tests gesimuleerd om tekst, taal en tempo te controleren. Het werkelijk hoorbare geluid en de Nederlandse systeemstem moeten op de gebruikte iPad worden beoordeeld. Er is geen fysieke iPad-test uitgevoerd.
