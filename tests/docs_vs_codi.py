#!/usr/bin/env python3
"""
docs_vs_codi.py — la documentació diu el mateix que el codi.

Per què existeix: el 17/10/2026 es van haver de corregir 87 fitxers .md
dels 34 repositoris de Step Quiz perquè descrivien fitxers que ja no hi eren,
xifres antigues o proves que no existien. Aquest test ho atura a l'origen:
falla, amb un missatge que diu què cal corregir, quan
  1. un document cita una ruta del repositori que no existeix, o
  2. una xifra clau de la documentació ja no quadra amb les dades.

Executar:  python3 tests/docs_vs_codi.py   (només biblioteca estàndard)
Si falla perquè has canviat el contingut, el que toca és posar al dia el
document que diu el missatge. Si una ruta es cita a propòsit sense existir
(un patró, un fitxer d'un altre repositori...), afegeix-la a EXCEPCIONS.
"""
import os
import re
import subprocess
import sys

ARREL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
errors = []


def llegeix(rel):
    with open(os.path.join(ARREL, rel), encoding='utf-8') as f:
        return f.read()


def fitxers_del_repo():
    sortida = subprocess.run(['git', '-C', ARREL, 'ls-files', '--cached', '--others', '--exclude-standard'], capture_output=True, text=True).stdout
    fitxers = [f for f in sortida.split('\n') if f]
    if not fitxers:  # sense git (p. ex. una còpia descomprimida): es recorre el disc
        for d, _, fs in os.walk(ARREL):
            if '/.git' in d or 'node_modules' in d:
                continue
            fitxers += [os.path.relpath(os.path.join(d, f), ARREL) for f in fs]
    return fitxers


def comprova(condicio, missatge):
    if not condicio:
        errors.append(missatge)


# ── 1. Rutes citades ─────────────────────────────────────────────────────
RUTA = re.compile(r'`([^`\s]+)`|\]\(([^)\s#]+)')
EXTENSIO = re.compile(r'\.(js|mjs|py|html|css|json|yml|sh|md|tex|txt|csv|svg|png|jpg|xlsx|pdf)$', re.I)


def comprova_rutes(documents, excepcions):
    fitxers = fitxers_del_repo()
    dirs = {os.path.dirname(f) for f in fitxers}
    for f in list(dirs):
        while f:
            f = os.path.dirname(f)
            dirs.add(f)
    for doc in documents:
        text = llegeix(doc)
        candidats = [(m.group(1) or m.group(2)).strip().rstrip('.,;:)') for m in RUTA.finditer(text)]
        # Arbres de fitxers dins de blocs ``` : el primer mot de cada línia
        # (les línies d'ordres —python3, node, npm, git...— no són arbres).
        linies_de_codi = [l for bloc in re.findall(r'```[^\n]*\n(.*?)```', text, re.S) for l in bloc.split('\n')]
        # també els blocs indentats amb 4 espais (fora dels ```)
        sense_fences = re.sub(r'```.*?```', '', text, flags=re.S)
        linies_de_codi += [l for l in sense_fences.split('\n') if l.startswith('    ') and not l.lstrip().startswith(('-', '*', '|'))]
        for linia in linies_de_codi:
            net = linia.strip().lstrip('├└│─ ').strip()
            if not net or re.match(r'(\$|python|node|npm|npx|git|cd|sh|pip|bash|#|//|<)', net):
                continue
            primer = net.split()[0].rstrip(',')
            if re.fullmatch(r'[\w.\-/]+', primer) and not re.search(r'\.\.|\*', primer):
                candidats.append(primer)
        for tok in candidats:
            if tok.startswith(('http', 'mailto', '#', '$', '-', '<', '/')):
                continue
            if not re.fullmatch(r'[\w.\-/]+', tok) or tok in excepcions:
                continue
            if re.fullmatch(r'\.\w+', tok):  # una extensió sola («.js»), no una ruta
                continue
            ruta = tok.split('?')[0].rstrip('/')
            while ruta.startswith('./'):
                ruta = ruta[2:]
            if not ruta or not ('/' in tok or EXTENSIO.search(ruta)):
                continue
            relativa = os.path.normpath(os.path.join(os.path.dirname(doc), ruta))
            if any(r in fitxers or r in dirs for r in (ruta, relativa)):
                continue
            if any(f == ruta or f.endswith('/' + ruta) for f in fitxers):
                continue
            if any(d.endswith('/' + ruta) for d in dirs):  # carpeta dins d'un arbre
                continue
            if ruta == os.path.basename(ARREL):  # el nom del repositori, al capdamunt d'un arbre
                continue
            comprova(False, f'{doc}: cita `{tok}`, que no és al repositori')


def acaba(nom):
    if errors:
        print(f'✗ {nom}: {len(errors)} discrepàncies entre la documentació i el codi:')
        for e in errors:
            print('  -', e)
        sys.exit(1)
    print(f'✓ {nom}: la documentació quadra amb el codi.')

DOCUMENTS = ['README.md']
EXCEPCIONS = ['ACTUALITZACIO-ANUAL.md', 'analitzador-stepquiz.html', 'banc-cb.html', 'genera_cb_items.py', 'js/codi-verificacio.js', 'noves/data/', 'pdfs/2eso_prova.pdf', 'pdfs/4eso_prova.pdf']

comprova_rutes(DOCUMENTS, EXCEPCIONS)

# ── 2. Xifres de cb ──────────────────────────────────────────────────────
import json
preguntes = json.loads(llegeix('preguntes.json'))
readme = llegeix('README.md')
comprova(f'**{len(preguntes)} preguntes**' in readme, f'README.md: hauria de dir «{len(preguntes)} preguntes»')
anys = {}
for q in preguntes:
    anys.setdefault(q['nivell'], set()).add(q['any'])
for nivell, nom in (('4eso', "4t d'ESO"), ('2eso', "2n d'ESO")):
    if nivell in anys:
        frase = f'{nom} de {min(anys[nivell])} a {max(anys[nivell])}'
        comprova(frase in readme, f'README.md: hauria de dir «{frase}»')
usades = {q[k] for q in preguntes for k in ('enunciat', 'pregunta') if q.get(k)}
sobrants = [f for f in os.listdir(os.path.join(ARREL, 'data'))
            if f.endswith('.png') and f'data/{f}' not in usades]
for f in sorted(sobrants):
    comprova(False, f'data/{f}: preguntes.json no la fa servir (esborra-la o afegeix la pregunta)')

acaba('cb')
