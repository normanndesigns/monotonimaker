# Monotonimaker
Program til at tegne monotonilinjer

## Sådan bruger du programmet
For at lave en monotonilinje skal du først og fremmest indtaste forskriften for den afledede funktion i feltet "Forskrift for den afledede". Monotonimaker anvender math.js. En detaljeret beskrivelse af syntaxen kan ses på http://mathjs.org/docs/expressions/syntax.html. Hvis du ønsker en anden variabel end x, kan det ændres under funktionsnavn, hvor du også kan ændre navnet på funktionen.

Når forskriften for den afledede er indtastet, kan du indtaste nulpunkter. Programmet kan på nuværende tidspunkt ikke selv finde nulpunkter, så dette skal gøres i hånden eller i et CAS-værktøj. Du indtaster nulpunktet (brug punktum som komma) og trykker mellemrum for at oprette nulpunktet. Det kan slettes igen med backspace eller ved at trykke på det med musen.

Du kan indtaste definitionsmængden for funktionen øverst til højre. Tryk på de firkantede parenteser for at skifte. Der er 3 muligheder for både den øvre og den nedre grænse.

1. Åbent interval til uendelig
2. Åbent interval afgrænset af en vilkårlig værdi
3. Lukket interval afgrænset af en vilkårlig værdi

Når alle oplysninger er indtastet, kan du trykke på knappen "Lav monotonilinje", og programmet tegner monotonilinjen for dig.

## Brug Monotonimaker offline
1. Download hele repoet og gem det i en mappe på din computer.
2. Åben index.html i en webbrowser, og programmet vil nu køre uden, at du behøver adgang til internettet.

## TODO
- Intastning af vilkårlige udtryk som funktionsnavn
- Tillad at man indtaster hvilke intervaller den afledede er større og mindre end nul, frem for at indtaste selve funktionen.
