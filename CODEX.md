# CODEX.md — Schubben geven

Werk uitsluitend in deze repository:

`hobbit12b/schubben`

Dit is een nieuwe, schone repository. Gebruik géén code, assets of oplossingen uit oudere repositories zoals `hobbit12b/schubben_geven`.

Deze instructie is de bron van waarheid voor het project.

---

## Project

Bouw een visueel aantrekkelijk educatief webspel voor kleuters in groep 1-2.

Naam:

**Schubben geven**

Leerdoel:

**Resultatief tellen**

Het kind bepaalt hoeveel visjes Regenboog een schub moet geven.

Primair apparaat:

- iPad
- landscape
- 4:3
- touchbediening
- zelfstandig speelbaar door kleuters

---

## Bestaand artwork

Gebruik het aangeleverde artwork daadwerkelijk als spelassets.

De compositie-afbeelding met Regenboog, visjes, gedachtewolk, voorgrond en schelp is alleen een **visuele referentie**.

Gebruik die compositie dus NIET als één grote achtergrondafbeelding.

De losse onderdelen moeten afzonderlijke lagen blijven:

- onderwaterachtergrond
- voorgronddecor
- Regenboog
- kleine visjes
- gesloten schelp

Maak indien nodig alleen nog:

- `shell-open.webp` met parel

De open schelp moet exact bij de goedgekeurde gesloten schelp passen.

---

## Gewenste projectstructuur

Gebruik bij voorkeur:

```text
index.html

assets/
  background.webp
  foreground.webp
  rainbow.webp
  fish-strip.webp
  shell-closed.webp
  shell-open.webp

css/
  style.css

js/
  game.js
```

PNG mag ook als WebP niet geschikt blijkt.

Niet toegestaan:

- base64-afbeeldingen in JavaScript
- data-URL loaders
- oude `visual-*` scripts
- oude `asset-*` scripts
- tijdelijke `*-fix-*` bestanden
- oude assets uit andere repositories
- emoji als vervanging voor artwork
- CSS-getekende vissen
- generieke tijdelijke illustraties

---

# Visuele stijl

De game moet visueel zeer dicht liggen bij het goedgekeurde compositievoorbeeld.

Gebruik:

- helderblauwe onderwaterwereld
- lichtstralen van boven
- zandbodem
- Regenboog groot bovenin
- gedachtewolk rechts van Regenboog
- kleine visjes in het midden
- donkerder voorgronddecor onderaan
- gesloten schelp centraal onderaan
- homeknop linksboven
- luidspreker rechtsboven indien audio actief is

De voorgrond bestaat uit:

- blauwe afgeronde rotsen
- groen zeewier
- roze/paarse buiskoralen
- oranje buiskoralen

De voorgrond moet donkerder zijn dan de achtergrond, maar niet bijna zwart.

De schelp blijft helder en opvallend.

Geen gele of gouden streepjes naast de schelp.

---

# Regenboog

Gebruik de goedgekeurde Regenboogillustratie.

Kenmerken:

- blauw gezicht
- grote vriendelijke ogen
- vrolijke glimlach
- glanzende kleurrijke schubben
- grote glinsterende vinnen
- duidelijk groter dan de kleine visjes

Regenboog staat boven het midden van het scherm.

Regenboog is ook de knop waarmee het kind het antwoord laat controleren.

Geef Regenboog daarom een ruim touchgebied.

---

# Kleine visjes

Gebruik de goedgekeurde kleine visjes.

Gebruik bij voorkeur:

- geel
- turquoise
- roze
- paars

Gebruik geen clownvis als standaard vissoort als dat visueel afwijkt van het goedgekeurde voorbeeld.

De visjes moeten:

- rond zijn
- vriendelijk zijn
- grote ogen hebben
- omhoog naar Regenboog kijken
- dezelfde illustratiestijl hebben

---

# Kijkrichting

Dit is een harde eis.

Alle kleine visjes moeten Regenboog aankijken.

Visjes links van de middenas:

```text
→
```

Visjes rechts van de middenas:

```text
←
```

Gebruik horizontale spiegeling met `scaleX(-1)` waar nodig.

De kijkrichting hoort bij het slot en wordt niet willekeurig bepaald.

---

# Beginscherm

Voor het spel kiest de leerkracht:

## Aanbiedingsvorm

- Visueel
- Auditief
- Visueel + auditief

## Niveau

- 1-5
- 1-10
- 1-12
- 1-20

Maak dit scherm duidelijk voor volwassenen.

Tijdens het echte spel moet juist vrijwel alle tekst verdwijnen.

---

# Doelgetal

Gebruik een geschud getallendeck.

Binnen een cyclus komt ieder getal één keer aan bod voordat een getal wordt herhaald.

Voorbeeld niveau 1-5:

```text
4, 1, 5, 2, 3
```

Daarna opnieuw schudden.

---

# Visuele modus

Toon het doelgetal groot in de gedachtewolk.

Het cijfer blijft tijdens de opdracht zichtbaar.

---

# Auditieve modus

Toon géén doelgetal.

Spreek:

`Regenboog wil aan X visjes een schub geven.`

Er is een luidsprekerknop waarmee de opdracht opnieuw beluisterd kan worden.

Het cijfer mag in auditieve modus nergens zichtbaar zijn.

Gebruik:

```js
speechSynthesis
```

met:

```js
utterance.lang = 'nl-NL'
```

Gebruik een rustig tempo.

Cancel altijd eerdere spraak voordat nieuwe spraak begint.

---

# Visueel + auditief

Toon het cijfer in de gedachtewolk en spreek dezelfde opdracht uit.

---

# Vaste visposities

Gebruik vaste slots.

Een nieuw visje gaat altijd naar het eerstvolgende lege slot.

Bestaande visjes mogen nooit verschuiven.

Geen:

- flexbox reflow
- automatisch centreren
- herschikken
- horizontaal opschuiven

---

# Niveau 1-5

Eén rij van 5 slots:

```text
→ → → ← ←
```

---

# Niveau 1-10

Twee rijen van 5:

```text
→ → → ← ←
→ → → ← ←
```

---

# Niveau 1-12

Bovenste rij van 10:

```text
→ → → → → ← ← ← ← ←
```

Onderste rij heeft 2 visjes in het midden:

```text
→ ←
```

---

# Niveau 1-20

Twee rijen van 10:

```text
→ → → → → ← ← ← ← ←
→ → → → → ← ← ← ← ←
```

---

# Schelp als toevoegknop

De gesloten schelp is de knop waarmee het kind visjes toevoegt.

Eén druk op de schelp:

1. schelp wordt kort zichtbaar ingedrukt
2. exact één visje wordt toegevoegd
3. visje begint onder de voorgrond
4. visje zwemt verticaal omhoog
5. visje komt zichtbaar achter de voorgrond vandaan
6. visje stopt in het eerstvolgende vaste slot

Laat het visje niet schuin vanaf de schelp naar zijn plaats vliegen.

Het moet lijken alsof de visjes onder de rotsen vandaan komen.

---

# Schelp indrukken

Bij aanraken mag de gesloten schelp kort ongeveer dit doen:

```css
transform:
  translateX(-50%)
  translateY(4%)
  scaleX(.96)
  scaleY(.90);
```

Duur ongeveer:

```text
80-120 ms
```

Daarna terug naar normaal.

---

# Laatst geplaatste vis verwijderen

Een klik op een willekeurig zichtbaar visje verwijdert NIET dat aangeklikte visje.

Er zwemt altijd het laatst toegevoegde visje weg.

Gebruik LIFO:

```text
last in, first out
```

Houd bijvoorbeeld bij:

```js
fishStack
```

Iedere vis roept bij aanraken aan:

```js
removeLastFish()
```

De andere visjes blijven exact op hun plaats staan.

---

# Wegzwemmen

Wanneer een visje wegzwemt:

1. behoud de huidige horizontale kijkrichting
2. spiegel het verticaal
3. zwem recht naar beneden
4. verdwijn achter de voorgrond

Gebruik bijvoorbeeld:

```css
transform:
  scaleX(var(--direction))
  scaleY(-1);
```

en animeer daarna de verticale beweging.

Belangrijk:

- geen boog
- geen diagonale beweging
- geen horizontale verplaatsing
- geen `scaleX`-wisseling tijdens wegzwemmen

Een vis links blijft dus naar rechts gericht maar wordt verticaal omgekeerd.

Een vis rechts blijft naar links gericht maar wordt verticaal omgekeerd.

---

# Voorgrondlaag

De voorgrond is een afzonderlijke transparante afbeelding.

De laagvolgorde moet ervoor zorgen dat visjes echt achter de voorgrond verdwijnen.

Gebruik ongeveer:

```text
achtergrond        z-index 1
Regenboog/wolk     z-index 5
visjes             z-index 10
voorgrond          z-index 20
schelp             z-index 30
UI                 z-index 40
```

---

# Antwoord controleren

Het kind drukt op Regenboog wanneer het denkt dat er genoeg visjes zijn.

Blokkeer tijdens het controleren nieuwe invoer.

Tel altijd alle aanwezige visjes één voor één.

Per visje:

1. geef visueel een glinsterende schub
2. spreek het volgende telwoord uit
3. korte pauze
4. spiegel visje verticaal
5. laat visje recht naar beneden zwemmen
6. laat het achter de voorgrond verdwijnen
7. ga daarna pas naar het volgende visje

Voorbeeld:

```text
1
2
3
4
5
```

Niet allemaal tegelijk.

---

# Goed antwoord

Wanneer:

```text
aantal visjes === doelgetal
```

dan:

1. Regenboog reageert blij
2. spreek `Goed geteld!`
3. gesloten schelp opent
4. er verschijnt een duidelijke parel
5. toon dit ongeveer 1 tot 1,5 seconde
6. schelp sluit weer
7. nieuwe opdracht begint automatisch

Geen knop `Volgende`.

---

# Open schelp

Maak een tweede passende afbeelding:

```text
assets/shell-open.webp
```

Deze moet exact aansluiten bij:

```text
assets/shell-closed.webp
```

De open versie:

- zelfde kleuren
- zelfde onderkant
- zelfde perspectief
- zelfde grootte
- zelfde positionering
- open bovenklep
- één duidelijke parel

Geen emoji-parel.

Geen compleet andere schelp.

---

# Fout antwoord

Ook bij een fout antwoord worden alle aanwezige visjes eerst één voor één geteld en weggezwommen.

Daarna spreek:

`Dit waren X visjes. Regenboog wilde Y visjes. Probeer het nog eens.`

Daarna blijft dezelfde doelhoeveelheid actief zodat het kind opnieuw kan proberen.

Geen:

- rood kruis
- boze vis
- harde fouttoon
- negatieve visuele feedback

---

# Homeknop

Homeknop linksboven.

Bij indrukken:

- stop eventuele spraak
- ga terug naar instellingen
- reset de huidige ronde
- verwijder alle actieve visjes
- reset busy-state

---

# Luidsprekerknop

Alleen zichtbaar als audio wordt gebruikt.

Bij indrukken:

spreek opnieuw:

`Regenboog wil aan X visjes een schub geven.`

---

# Geen zichtbare teller

Toon nergens hoeveel visjes momenteel geplaatst zijn.

Het kind moet zelf tellen.

Geen:

- score
- huidige hoeveelheid
- tellerbadge
- tekst als `5 visjes`

---

# Animaties

## Visje verschijnt

Start ongeveer:

```css
transform: translateY(160%);
opacity: 0;
```

Eind:

```css
transform: translateY(0);
opacity: 1;
```

Duur:

```text
450-600 ms
```

Gebruik een rustige ease-out.

---

## Visje verdwijnt

Eerst verticaal omdraaien.

Daarna:

```css
transform: translateY(160%);
```

Duur ongeveer:

```text
400-550 ms
```

Laat het achter het voorgronddecor verdwijnen.

---

# Responsive ontwerp

Primair voor iPad landscape.

Gebruik een vaste interne verhouding:

```css
aspect-ratio: 4 / 3;
```

Schaal de complete game proportioneel naar het beschikbare scherm.

Geen pagina-scroll.

Touch moet betrouwbaar werken in Safari/iPadOS.

---

# Codeopbouw

Gebruik geen framework tenzij echt nodig.

Houd het eenvoudig:

```text
index.html
css/style.css
js/game.js
assets/
```

Gebruik duidelijke functies zoals:

```js
startGame()
setupRound()
buildSlots()
addFish()
createFish()
removeLastFish()
checkAnswer()
giveScaleToFish()
swimFishAway()
openShell()
closeShell()
showCorrectReward()
nextTarget()
goHome()
```

Gebruik bijvoorbeeld één centrale state:

```js
const state = {
  mode: 'visual',
  max: 10,
  target: 1,
  fishStack: [],
  busy: false
};
```

---

# Belangrijke functionele regel

Gebruik voor toevoegen de volgorde:

```text
slot 1
slot 2
slot 3
...
```

Gebruik voor handmatig verwijderen de omgekeerde volgorde:

```text
laatst toegevoegd
voorlaatst toegevoegd
...
```

Gebruik bij antwoordcontrole de gewone telvolgorde vanaf het eerste geplaatste visje.

---

# Oude fouten die NIET terug mogen komen

Controleer expliciet dat deze fouten ontbreken:

- kapotte afbeeldingicons
- zichtbare alt-tekst
- tekst `Visje`
- tekst `Schelp`
- verkeerde vissen
- clownvis die afwijkt van stijl
- visjes die van Regenboog wegkijken
- verkeerde horizontale spiegeling
- visjes die verschuiven bij toevoegen
- visjes die schuin binnenkomen
- visjes die schuin wegzwemmen
- voorgrond ontbreekt
- voorgrond staat achter de vissen
- schelp staat open tijdens normaal spelen
- gouden streepjes naast schelp
- cijfer zichtbaar in auditieve modus
- rode X bij fout antwoord
- teller van aantal visjes
- oude base64 loaders
- code uit `schubben_geven`
- tijdelijke fallback graphics

---

# Testplan

Test minimaal alle onderstaande gevallen.

## Niveau 1-5

```text
→ → → ← ←
```

## Niveau 1-10

```text
→ → → ← ←
→ → → ← ←
```

## Niveau 1-12

```text
→ → → → → ← ← ← ← ←
        → ←
```

## Niveau 1-20

```text
→ → → → → ← ← ← ← ←
→ → → → → ← ← ← ← ←
```

Controleer daarnaast:

- startscherm
- visueel
- auditief
- visueel + auditief
- schelp 1 keer = exact 1 vis
- snel meerdere keren schelp aantikken
- maximum aantal
- vaste slots
- geen verschuiving
- alle vissen kijken Regenboog aan
- willekeurige vis aanklikken verwijdert laatste vis
- meerdere keren terughalen
- verticaal spiegelen bij wegzwemmen
- verdwijnen achter voorgrond
- goed antwoord
- fout antwoord
- telwoorden correct
- open schelp met parel
- schelp daarna weer gesloten
- nieuwe ronde
- homeknop
- speakerknop
- iPad 4:3
- geen scroll
- geen console-errors
- geen ontbrekende assets
- geen 404-fouten

---

# Afronding

Maak het spel daadwerkelijk volledig speelbaar.

Rond de taak niet af met alleen:

- een plan
- TODO's
- pseudocode
- placeholders

Implementeer het volledige spel.

Maak na implementatie een pull request met:

- korte uitleg van de architectuur
- welke assets gebruikt zijn
- welke spelregels geïmplementeerd zijn
- welke tests uitgevoerd zijn

Als iets uit bestaande code strijdig is met dit document, dan geldt dit document.

Als oud artwork strijdig is met het aangeleverde goedgekeurde artwork, dan geldt het nieuwe artwork.

Bouw schoon. Voeg geen tijdelijke reparatielaag bovenop een fout ontwerp toe.
