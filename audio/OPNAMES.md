# Geluidsbestanden

Alle 45 aangeleverde stemopnames staan in `audio/voice/` en zijn gekoppeld aan het spel.

| Bestand | Gebruik |
| --- | --- |
| `01.mp3` t/m `20.mp3` | Getal aantikken; tellen tijdens controleren in de audiomodi |
| `01geven.mp3` t/m `20geven.mp3` | Opdracht in de audiomodi en via de luidsprekerknop |
| `uitleg.mp3` | Eenmalige beginuitleg na openen, in alle modi |
| `druk op schelp.mp3` | Hulp bij de oplichtende schelp na acht seconden zonder bediening |
| `goed geteld.mp3` | Beloning bij een goed antwoord in de audiomodi |
| `nognietgenoegvisjesprobeernogeens.mp3` | Aanmoediging bij te weinig visjes |
| `teveelvisjesprobeerhetnogeens.mp3` | Aanmoediging bij te veel visjes |

`audio/plop.mp3` klinkt bij toevoegen én handmatig weghalen. `audio/glitter.mp3` begint met de vlucht van een schub, alleen bij een goed antwoord.

`audio/achtergrondmuziek.mp3` herhaalt zacht tijdens het spel (10%, tijdens een stemopname 4,5%). De muzieknoot schakelt alleen de muziek uit of aan; deze voorkeur blijft bewaard. Er staat geen tekst op de knop. Home stopt muziek, stem en effecten.

Web Audio decodeert de korte bestanden vóór Start. Muziek wordt gestreamd. Bij openen als lokaal bestand gebruikt het spel native HTML-audio. De Nederlandse computerstem dient alleen als reserve bij een niet-afspeelbare stemopname.
