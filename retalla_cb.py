#!/usr/bin/env python3
"""
retalla_cb2.py — genera els PNG d'enunciat i pregunta d'una prova CB oficial
amb la convenció de cb.step-quiz.net:
    data/cb<nivell><any>e<N>.png   (enunciat del bloc N)
    data/cb<nivell><any>p<M>.png   (pregunta M, amb la numeració oficial de la prova)

La maquetació oficial és molt regular:
  · barra grisa "ACTIVITAT n."  sempre a y = 96.4–113.4
  · columna de text             x = 79.4 … 518.7
  · peu de pàgina               y = 811.0
  · cada pregunta comença amb "<num>." a l'esquerra de la columna

Regles de segmentació
---------------------
BLOC = un estímul compartit + les preguntes que en pengen.
  · Si entre la barra grisa i la primera pregunta hi ha contingut → hi ha
    estímul nou → comença un bloc nou.
  · Si no n'hi ha (pàgina de continuació de la mateixa activitat), les
    preguntes s'afegeixen al bloc anterior.

Amplada
-------
Es parteix de la columna de text, però si el contingut (una figura ampla,
per exemple) surt del marge, el retall s'eixampla fins a encabir-lo. Així
no es talla mai res i els retalls normals queden ajustats.
"""
import os, re, shutil, subprocess, sys
import pdfplumber
from PIL import Image

DPI        = 312            # la columna de text queda a ~1939 px
COL_X0     = 79.4
COL_X1     = 518.7
PAD_X      = 4.0
CERCA_X0   = 20.0           # marge de cerca per detectar contingut desbordat
CERCA_X1   = 578.0
BAR_TOP    = 96.4
FOOTER_Y   = 811.0
PAD_TOP    = 4.0
GAP        = 6.0
LLINDAR_BUIT = 130          # px: per sota d'això l'enunciat és només la barra grisa
BLANC      = 245


def pt2px(v):
    return int(round(v * DPI / 72.0))


def preguntes_de(pg):
    out = []
    for w in pg.extract_words():
        if re.fullmatch(r'\d{1,2}\.', w['text']) and w['x0'] < 100 and 90 < w['top'] < FOOTER_Y - 10:
            out.append((int(w['text'][:-1]), w['top']))
    out.sort(key=lambda t: t[1])
    vist, net = set(), []
    for num, top in out:
        if num not in vist:
            vist.add(num); net.append((num, top))
    return net


def extensio_tinta(im):
    """(x0, x1, y0, y1) de la tinta dins la imatge, o None si és tota blanca."""
    g = im.convert('L'); w, h = g.size; px = g.load()
    xs0, xs1, ys = w, 0, []
    for y in range(0, h):
        fila0, fila1 = None, None
        for x in range(0, w, 2):
            if px[x, y] < BLANC:
                if fila0 is None:
                    fila0 = x
                fila1 = x
        if fila0 is not None:
            ys.append(y)
            xs0 = min(xs0, fila0); xs1 = max(xs1, fila1)
    if not ys:
        return None
    return xs0, xs1, ys[0], ys[-1]


def retalla(pagina, y_dalt_pt, y_baix_pt, marge=8):
    """Retalla la banda vertical donada, ajustant amplada i alçada a la tinta."""
    x0 = pt2px(CERCA_X0); x1 = pt2px(CERCA_X1)
    banda = pagina.crop((x0, pt2px(y_dalt_pt), x1, pt2px(y_baix_pt)))
    ext = extensio_tinta(banda)
    if ext is None:
        return None
    ix0, ix1, iy0, iy1 = ext
    # amplada: com a mínim la columna de text; més ampla si el contingut desborda
    esq = min(pt2px(COL_X0 - PAD_X) - x0, max(0, ix0 - marge))
    dre = max(pt2px(COL_X1 + PAD_X) - x0, min(banda.width, ix1 + marge))
    return banda.crop((esq, max(0, iy0 - marge), dre, min(banda.height, iy1 + marge)))


def processa(pdf_path, nivell, any_, sortida, primera=2):
    os.makedirs(sortida, exist_ok=True)
    pdf = pdfplumber.open(pdf_path)
    npag = len(pdf.pages)
    tmp = os.path.join(sortida, '_tmp'); os.makedirs(tmp, exist_ok=True)
    subprocess.run(['pdftoppm', '-png', '-r', str(DPI), '-f', str(primera), '-l', str(npag),
                    pdf_path, os.path.join(tmp, 'pg')], check=True)
    amp = max(2, len(str(npag)))

    blocs = []          # [{'num':1,'pagines':[2],'preguntes':[1,2]}]
    escrits = []

    for i in range(primera, npag + 1):
        pg = pdf.pages[i - 1]
        qs = preguntes_de(pg)
        if not qs:
            continue
        f = os.path.join(tmp, f'pg-{i:0{amp}d}.png')
        if not os.path.exists(f):
            f = os.path.join(tmp, f'pg-{i}.png')
        pagina = Image.open(f).convert('RGB')

        enun = retalla(pagina, BAR_TOP - PAD_TOP, qs[0][1] - GAP)
        te_estimul = enun is not None and enun.height >= LLINDAR_BUIT

        if te_estimul or not blocs:
            blocs.append({'num': len(blocs) + 1, 'pagines': [i], 'preguntes': []})
            nom = f'cb{nivell}{any_}e{blocs[-1]["num"]}.png'
            enun.save(os.path.join(sortida, nom))
            escrits.append((nom, enun.size, i, 'enunciat'))
        else:
            blocs[-1]['pagines'].append(i)

        for j, (qnum, qtop) in enumerate(qs):
            baix = qs[j + 1][1] - GAP if j + 1 < len(qs) else FOOTER_Y - GAP
            im = retalla(pagina, qtop - GAP, baix)
            nom = f'cb{nivell}{any_}p{qnum}.png'
            im.save(os.path.join(sortida, nom))
            escrits.append((nom, im.size, i, 'pregunta'))
            blocs[-1]['preguntes'].append(qnum)

    shutil.rmtree(tmp)
    return blocs, escrits


if __name__ == '__main__':
    for nivell, pdf_path in (('2eso', 'pdfs/2eso_prova.pdf'), ('4eso', 'pdfs/4eso_prova.pdf')):
        print(f'\n=== {nivell} 2026 ===')
        blocs, escrits = processa(pdf_path, nivell, 2026, 'noves/data')
        for b in blocs:
            print(f"  bloc {b['num']:>2}  pàg. {b['pagines']}  preguntes {b['preguntes']}")
        amples = {s[1][0] for s in escrits}
        print(f'  {len(escrits)} imatges · {len(blocs)} blocs · amplades {min(amples)}–{max(amples)} px')
