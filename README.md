# Step Quiz: Competències Bàsiques de Matemàtiques

Plataforma interactiva per practicar les proves de competències bàsiques de matemàtiques de l'ESO (Catalunya). Permet als alumnes entrenar amb preguntes reals d'exàmens oficials en dos modes: pràctica (amb pistes pedagògiques) i examen (simulació real).

## Com funciona?

No requereix instal·lació ni servidor. Són arxius totalment estàtics.

1. Obre `index.html` al navegador — és el **generador d'enllaços** per al professorat.
2. Configura la prova: mode (pràctica/examen), nivell, any, dificultat i sentit matemàtic.
3. Copia l'enllaç generat o obre la prova directament.
4. L'alumne resol les preguntes i, en acabar, obté un **codi de verificació** que lliura al professor.

## Arquitectura

```
cb/
├── index.html          ← Generador d'enllaços (pàgina del professorat)
├── test.html           ← Pàgina de la prova (pàgina de l'alumne)
├── core.js             ← Motor de joc (càrrega JSON, validació, codi antifrau)
├── shared.css          ← Estils globals (2 columnes, responsiu, mode horitzontal)
├── preguntes.json      ← Base de dades de preguntes (enunciats, pistes, respostes)
└── data/               ← Imatges dels enunciats i preguntes (PNG)
    ├── cb4eso2025e1.png
    ├── cb4eso2025p1.png
    └── ...
```

## Paràmetres URL de la prova (test.html)

| Paràmetre | Valors | Descripció |
|-----------|--------|------------|
| `p` | `0` o `1` | Mode: 0=examen, 1=pràctica (amb pistes) |
| `nivell` | `4eso`, `2eso` | Nivell educatiu |
| `any` | `2022`-`2026` | Any de la convocatòria |
| `dificultat` | `1`, `2`, `3` | Nivell de dificultat |
| `sentit` | `espacial`, `mesura`, `estocastic`, `numeric`, `algebraic` | Sentit matemàtic |
| `max` | enter positiu | Nombre màxim de preguntes |

Exemple: `test.html?p=1&nivell=4eso&any=2025&dificultat=1`

## Format del codi de verificació

En acabar la prova, l'alumne obté un codi que inclou la nota, data/hora i una lletra de control antifrau (algorisme tipus DNI). El professor pot verificar la integritat del codi sense necessitat de cap sistema en línia.

**Mode examen:** `Lsss-DDMM-HHMM-NN,NN-cb`
**Mode pràctica:** `Lsss-DDMM-HHMM-NN,NN-RRRR...R-cb`

On `L` és la lletra de control, `sss` codifica el nivell i l'any, i `RRRR...R` són els intents per pregunta.

## Estructura del JSON de preguntes

Cada entrada de `preguntes.json` segueix aquest format:

```json
{
  "id": 1,
  "any": 2025,
  "nivell": "4eso",
  "dificultat": 1,
  "sentit": "estocastic",
  "enunciat": "data/cb4eso2025e1.png",
  "pregunta": "data/cb4eso2025p1.png",
  "indexCorrecte": 0,
  "pistes": [
    "",
    "Pista per a l'opció B...",
    "Pista per a l'opció C...",
    "Pista per a l'opció D..."
  ]
}
```

El camp `pistes` conté 4 textos (un per opció A-D). La pista de la resposta correcta és buida (`""`).

## Afegir l'edició d'un any nou

De cada nivell, el Departament publica la prova, el full de respostes i un document de
descripció amb les especificacions dels ítems i la clau de respostes. **D'aquest tercer
document en surten el sentit, el grau de complexitat i la resposta correcta de cada ítem**:
no cal deduir res.

1. `python3 retalla_cb.py` sobre els PDF de la prova. Genera els PNG a `data/` amb la
   convenció `cb<nivell><any>e<N>.png` (enunciat del bloc N) i `cb<nivell><any>p<M>.png`
   (pregunta M, amb el número oficial de l'ítem). Revisa'ls: la segmentació és automàtica.
2. Transcriu les metadades: `dificultat` (Bàsic 1 · Intermedi 2 · Superior 3) i
   `indexCorrecte` (a 0 · b 1 · c 2 · d 3).
3. Afegeix les entrades a `preguntes.json` amb ids correlatius a partir de l'últim,
   **inserides abans del claudàtor de tancament** per no reserialitzar el fitxer sencer.
4. Prou. El desplegable d'anys de l'`index.html` es refà sol llegint `preguntes.json`; la
   llista escrita al codi només és la reserva per si el fitxer no es pot llegir.

Ítems que no siguin d'opció múltiple de quatre (per exemple els de Verdader/Fals en dues
parts) s'ometen: hi ha precedents a totes les edicions. Si n'omets un, no copiïs la seva
imatge a `data/`.

Al projecte del departament (`m`) hi ha la guia completa dels dos eixos, CB i Florence, a
`ACTUALITZACIO-ANUAL.md`, i el guió `genera_cb_items.py`, que refà el banc de `banc-cb.html`
a partir d'aquest `preguntes.json`.

## Tecnologies

- HTML5 / CSS3 purs (sense frameworks)
- Vanilla JavaScript (ES6)
- Disseny responsiu amb mode horitzontal obligatori en mòbils
- Cap backend: tot s'executa al navegador

## Llicència

© 2026 David Arso Civil. Ús educatiu lliure. Prohibida la comercialització i la modificació ([CC BY-NC-ND 4.0](http://creativecommons.org/licenses/by-nc-nd/4.0/)).
