# Step Quiz: Competències Bàsiques de Matemàtiques

Plataforma interactiva per practicar les proves de competències bàsiques de matemàtiques de l'ESO (Catalunya). Permet als alumnes entrenar amb preguntes reals d'exàmens oficials en dos modes: pràctica (amb pistes pedagògiques) i examen (simulació real).

## Com funciona?

No requereix instal·lació ni servidor. Són arxius totalment estàtics.

1. Obre `index.html` al navegador — és el **generador d'enllaços** per al professorat.
2. Configura la prova: mode (pràctica/examen), nivell, any, dificultat i sentit matemàtic (aquests dos, amb selecció múltiple).
3. Copia l'enllaç generat o obre la prova directament.
4. L'alumne resol les preguntes i, en acabar, obté un **codi de verificació** que lliura al professor.

## Arquitectura

```
cb/
├── index.html          ← Generador d'enllaços (pàgina del professorat)
├── test.html           ← Pàgina de la prova (pàgina de l'alumne)
├── core.js             ← Motor de joc (càrrega JSON, validació)
├── codi.js             ← Codi de verificació v3 (lògica pura, sense DOM)
├── shared.css          ← Estils globals (2 columnes, responsiu, mode horitzontal)
├── preguntes.json      ← Base de dades de preguntes (enunciats, pistes, respostes, tipus d'error)
├── errors.json         ← Tipus d'error de les opcions incorrectes (nom i descripció)
├── data/               ← Imatges dels enunciats i preguntes (PNG)
│   ├── cb4eso2025e1.png
│   ├── cb4eso2025p1.png
│   └── ...
├── retalla_cb.py       ← Retalla els PDF oficials en PNG (vegeu «Afegir l'edició d'un any nou»)
├── eines/optimitza_png.py ← Comprimeix els PNG de data/ sense cap pèrdua (els mateixos píxels).
│                         Passa-ho després de retalla_cb.py: l'oct. de 2026 va deixar data/ de 34 a 18 MB
├── _headers            ← Capçaleres de Cloudflare Pages: CORS obert a /data/*, perquè
│                         un altre web en pugui descarregar les imatges (m ja no ho necessita:
│                         des del 18/10/2026 en té una còpia a m/cb/data/)
├── googled9af5cf2562dfba3.html ← Verificació de Google Search Console
└── icon.png, LICENSE, LLICENCIA.md
```

Ara mateix el banc té **218 preguntes**: 4t d'ESO de 2022 a 2026 i 2n d'ESO de 2024 a 2026.
Totes les imatges de `data/` les fa servir `preguntes.json`: si en sobra alguna, `tests/docs_vs_codi.py` falla i diu quina és.

## Paràmetres URL de la prova (test.html)

| Paràmetre | Valors | Descripció |
|-----------|--------|------------|
| `p` | `0`, `1` o `2` | Mode: 0=examen, 1=pràctica (amb pistes), 2=examen sense nota final (funciona com l'examen, però en acabar no es mostra la nota, només el codi; el codi és idèntic al de l'examen) |
| `nivell` | `4eso`, `2eso` | Nivell educatiu |
| `any` | `2022`-`2026` (2n d'ESO només 2024-2026) | Any de la convocatòria |
| `dificultat` | `1`, `2`, `3`, o diversos separats per comes (`1,2` · `2,3` · `1,3`…) | Nivell o nivells de dificultat. Si no hi és, o hi són els tres, no es filtra |
| `sentit` | `espacial`, `mesura`, `estocastic`, `numeric`, `algebraic`, o diversos separats per comes (`numeric,algebraic`…) | Sentit o sentits matemàtics. Si no hi és, o hi són els cinc, no es filtra |
| `max` | enter positiu | Nombre màxim de preguntes |
| `q` | ids separats per comes, amb rangs | Tria explícita de preguntes: `11-14,24,28`. S'aplica abans de `max` i respecta l'ordre del banc. Els ids que no passin la resta de filtres s'ignoren |

Exemples: `test.html?p=1&nivell=4eso&any=2025&dificultat=1` · `test.html?p=1&dificultat=2,3&sentit=numeric,algebraic`

## Format del codi de verificació

En acabar la prova, l'alumne obté un codi (format **v3**, que llegeix `analitzador-stepquiz.html`)
amb la nota, la data i l'hora, el que s'havia triat a l'enllaç (convocatòria, dificultats i sentits),
una empremta de les preguntes, el resultat de cada pregunta i una lletra de control tipus DNI. El
professor el pot verificar sense cap sistema en línia. El construeix `codi.js` (lògica pura, amb
`tests/codi.test.js`).

```
Lsss-DDMM-HHMM-CB-D-S-QQ-AA-F-SS-EEEE-NNN-RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
```

| Camp | Significat |
|---|---|
| `L` | lletra de control (`TRWAGMYFPDXBNJZSQVHLCKE`). Cobreix tot el codi: la nota, la data, l'hora, `s`, el nivell, el mode, les preguntes, la convocatòria, les dificultats, els sentits, l'empremta i cada resultat (la fórmula és la de `js/codi-verificacio.js` d'operacions, aplicada al cos del v3) |
| `sss` | `q` (4t d'ESO) o `s` (2n d'ESO o sense nivell) + els dos últims dígits de l'any **en què es fa la prova** (no el de la convocatòria) |
| `CB` | codi d'exercici, sempre `CB` |
| `D` | nivell: `1` = 2n d'ESO, `2` = 4t d'ESO, `0` = sense nivell |
| `S` | mode: `1` = examen, `2` = pràctica |
| `QQ` | nombre de preguntes |
| `AA` | convocatòria triada: els dos últims dígits de l'any (`25`), o `00` = tots els anys |
| `F` | dificultats triades, com a suma: baixa = `1`, mitjana = `2`, alta = `4` (`7` = totes; `3` = baixa i mitjana; `5` = baixa i alta; `6` = mitjana i alta) |
| `SS` | sentits triats, com a suma de dues xifres: numèric = `1`, algebraic = `2`, de mesura = `4`, espacial = `8`, estocàstic = `16` (`31` = tots) |
| `EEEE` | empremta de la llista d'ids de les preguntes, en ordre: 4 lletres de la A a la W (FNV-1a de 32 bits del text `id,id,id…`). Dues proves amb la mateixa empremta tenen exactament les mateixes preguntes; si el professor ha triat preguntes una a una (paràmetre `q`) o el banc ha canviat, l'empremta ho delata encara que els filtres coincideixin |
| `NNN` | nota × 10, de `000` a `100` |
| `R…R` | una xifra per pregunta. Examen: `1` encert, `4` error. Pràctica: intents (`1`–`3`) o `4` fallada. S'omple amb `0` fins a 30 posicions (40 si hi ha més de 30 preguntes) |

Els codis **v2** (9 segments, sense `AA`, `F`, `SS` ni `EEEE`) són els d'abans de la nova generació;
l'analitzador els segueix llegint. Les lletres de l'empremta són 23 de seguides (A-W) perquè canviar-ne
una de sola mai quedi amagat per la lletra de control. Els vectors de `tests/codi.test.js` són els
mateixos que té el test de la lletra de control a `operacions`: si es toca el format, cal tocar-lo als dos.

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
  ],
  "errors": [null, "DADES", "PASSOS", "QUADRA"]
}
```

El camp `pistes` conté 4 textos (un per opció A-D). La pista de la resposta correcta és buida (`""`).

El camp `errors` diu, també per a cada opció, **quin tipus d'error** porta a triar-la: és el
model dels distractors etiquetats de repas. L'opció correcta hi té `null`, i també una opció
incorrecta la pista de la qual no apunta a cap error concret («Revisa els càlculs»). En mode
pràctica, quan l'alumne tria una opció incorrecta, el nom del tipus surt en una etiqueta vermella
damunt de la pista (si passes el ratolí per sobre, en surt la descripció). Els tipus són a
`errors.json`:

| Tipus | Nom | Quan |
|---|---|---|
| `LLEGIR` | Lectura de l'enunciat | La resposta contesta una altra cosa del que es demana: el màxim en lloc del valor en un moment, l'opció que sí que compleix quan es busca la que no, una pregunta veïna… |
| `DADES` | Dada equivocada | El procediment és bo, però s'ha agafat un valor que no toca: de la taula, del gràfic, de l'enunciat o d'una pregunta anterior. |
| `COMPTAR` | Recompte | S'han deixat casos per comptar o se n'han comptat de més (punts d'un gràfic, casos favorables, combinacions…). |
| `OPERACIO` | Operació equivocada | S'ha triat una operació que no correspon a la situació: sumar en lloc de restar, multiplicar en lloc de dividir, una regla de tres on no n'hi ha… |
| `CALCUL` | Error de càlcul | L'estratègia és bona, però falla una operació concreta (una suma, una divisió, una simplificació). |
| `PASSOS` | Raonament incomplet | S'ha fet bé una part del camí, però falta un pas o se n'ha saltat un d'intermedi. |
| `PROPORCIO` | Proporcionalitat | La relació entre les quantitats no és la correcta: regla de tres, escala, percentatge, recepta o mescla. |
| `FORMULA` | Fórmula o propietat | S'ha aplicat malament una fórmula (àrea, volum, perímetre…) o una propietat (de la probabilitat, d'una equació…). |
| `UNITATS` | Unitats | No s'ha passat bé d'una unitat a l'altra, o s'han barrejat unitats diferents. |
| `ESPAI` | Visió espacial | Desenvolupaments, plecs, girs, vistes o figures que no encaixen com s'ha imaginat. |
| `QUADRA` | Resultat poc raonable | El valor és massa gran o massa petit per a la situació: contrastar-lo amb l'enunciat ho hauria detectat. |
| `GAIREBE` | Gairebé | La resposta s'acosta molt a la correcta: falla un últim detall. |
| `PATRO` | Patró | No s'ha trobat bé com creix o es repeteix una seqüència de figures o de nombres. |

Per afegir-ne un, posa'l a `errors.json` i a aquesta taula. Les proves fallen si una pregunta fa
servir un tipus que no és a `errors.json`, si un tipus no el fa servir cap pregunta o si falta a la
taula.

## Afegir l'edició d'un any nou

De cada nivell, el Departament publica la prova, el full de respostes i un document de
descripció amb les especificacions dels ítems i la clau de respostes. **D'aquest tercer
document en surten el sentit, el grau de complexitat i la resposta correcta de cada ítem**:
no cal deduir res.

1. Desa els PDF de la prova a `pdfs/2eso_prova.pdf` i `pdfs/4eso_prova.pdf` (carpeta que
   no es puja al repositori) i executa `python3 retalla_cb.py 2027`, amb l'any de la
   convocatòria (necessita `pdfplumber`, `Pillow` i `pdftoppm`). Deixa els PNG a
   `noves/data/`. Amb `--2eso`, `--4eso` i `--sortida` es poden fer servir altres rutes
   (`python3 retalla_cb.py --help`). Genera els PNG amb la convenció `cb<nivell><any>e<N>.png` (enunciat del bloc N) i
   `cb<nivell><any>p<M>.png` (pregunta M, amb el número oficial de l'ítem). Revisa'ls (la
   segmentació és automàtica) i copia els bons a `data/`.
2. Transcriu les metadades: `dificultat` (Bàsic 1 · Intermedi 2 · Superior 3) i
   `indexCorrecte` (a 0 · b 1 · c 2 · d 3). Escriu una pista per a cada opció incorrecta
   (`pistes`) i tria'n el tipus d'error (`errors`, vegeu la taula de més amunt).
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

## Proves

`python3 tests/docs_vs_codi.py` comprova que aquest README diu el mateix que les dades: el nombre
de preguntes, els anys de cada nivell, les imatges que `preguntes.json` no fa servir i que les
rutes citades existeixen. També comprova les pistes i els tipus d'error: cada opció incorrecta té
pista (cap «pista pendent»), l'opció correcta no en té, i els tipus són els d'`errors.json`. GitHub l'executa a cada canvi a `main`, a cada pull request i després de
cada ZIP (`.github/workflows/tests.yml`). Si falla perquè has afegit preguntes, posa al dia la xifra
que diu el missatge.

## Tecnologies

- HTML5 / CSS3 purs (sense frameworks)
- Vanilla JavaScript (ES6)
- Disseny responsiu amb mode horitzontal obligatori en mòbils
- Cap backend: tot s'executa al navegador

## Llicència

Contingut sota **CC BY-NC-SA 4.0** i codi sota **MIT** (vegeu `LLICENCIA.md`).

<!-- atribucio-centre:inici -->

---

Material desenvolupat per **David Arso Civil** per al Departament de Matemàtiques de l'INS Miquel Tarradell.
Contingut sota CC BY-NC-SA 4.0, codi sota llicència MIT. Vegeu [`LLICENCIA.md`](LLICENCIA.md).

<!-- atribucio-centre:final -->
