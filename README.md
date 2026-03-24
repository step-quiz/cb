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
| `any` | `2022`-`2025` | Any de la convocatòria |
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

## Tecnologies

- HTML5 / CSS3 purs (sense frameworks)
- Vanilla JavaScript (ES6)
- Disseny responsiu amb mode horitzontal obligatori en mòbils
- Cap backend: tot s'executa al navegador

## Llicència

© 2026 David Arso Civil. Ús educatiu lliure. Prohibida la comercialització i la modificació ([CC BY-NC-ND 4.0](http://creativecommons.org/licenses/by-nc-nd/4.0/)).
