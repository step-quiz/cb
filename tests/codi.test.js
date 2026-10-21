/**
 * ============================================================================
 * PROJECTE: Step Quiz — Competències Bàsiques (cb)
 * FITXER: tests/codi.test.js
 * ROL: Comprova codi.js (el codi de verificació v3):
 *   1. Vectors fixos: unes entrades i el codi exacte que n'ha de sortir. Són els
 *      MATEIXOS que té tests/codi-verificacio.test.js a operacions, que els llegeix
 *      amb la fórmula de l'analitzador: si un canvia sense l'altre, algú falla.
 *   2. Les màscares de dificultats i sentits, l'any, l'empremta i els resultats.
 *   3. Que canviar un sol caràcter del codi faci deixar de quadrar la lletra.
 * ÚS: node tests/codi.test.js     (només Node, cap dependència)
 * ============================================================================
 */
'use strict';
const assert = require('assert');
const path = require('path');
const C = require(path.join(__dirname, '..', 'codi.js'));

let fets = 0;
const prova = (nom, fn) => {
    try {
        fn();
        fets++;
        console.log('  ✓ ' + nom);
    } catch (e) {
        console.log('  ✗ ' + nom + '\n      ' + String(e.message).split('\n').join('\n      '));
        process.exitCode = 1;
    }
};
const enc = (ids, mal = []) => ids.map(id => ({ id, encertat: !mal.includes(id) }));
const rang = (n, des = 1) => Array.from({ length: n }, (_, i) => i + des);

// ── 1. Vectors fixos ─────────────────────────────────────────────────────────
// (els mateixos, amb els mateixos codis, que a operacions: tests/codi-verificacio.test.js)
const VECTORS = [
    {
        nom: 'pràctica, 4t ESO, convocatòria 2025, dificultats 1+2, sentits numèric+algebraic',
        entrada: { ara: new Date(2026, 9, 20, 11, 50), nivell: '4eso', any: '2025', dificultats: ['1', '2'], sentits: ['numeric', 'algebraic'], modeExamen: false, ids: [1, 2, 3, 4], resultatsExamen: enc([1, 2, 3, 4]), intentsPerPregunta: { 1: 1 }, notaSobre10: 10 },
        codi: 'Mq26-2010-1150-CB-2-2-04-25-3-03-GTGS-100-211100000000000000000000000000',
    },
    {
        nom: 'examen, sense filtres (tot): any 00, dificultats 7, sentits 31',
        entrada: { ara: new Date(2026, 9, 20, 9, 5), nivell: null, any: null, dificultats: [], sentits: [], modeExamen: true, ids: rang(8, 11), resultatsExamen: enc(rang(8, 11), [12, 15]), intentsPerPregunta: {}, notaSobre10: 7.5 },
        codi: 'Ns26-2010-0905-CB-0-1-08-00-7-31-PSSH-075-141141110000000000000000000000',
    },
    {
        nom: '31 preguntes (resultats de 40 posicions), 2n ESO, 29/12',
        entrada: { ara: new Date(2026, 11, 29, 23, 59), nivell: '2eso', any: '2024', dificultats: ['3'], sentits: ['espacial'], modeExamen: false, ids: rang(31), resultatsExamen: enc(rang(31)), intentsPerPregunta: { 2: 1, 5: 2, 9: 7 }, notaSobre10: 10 },
        codi: 'Bs26-2912-2359-CB-1-2-31-24-4-08-UHVO-100-1211311141111111111111111111111000000000',
    },
    {
        nom: 'examen, tres sentits i dificultats 2+3, prova feta l\u2019any següent',
        entrada: { ara: new Date(2027, 0, 4, 8, 0), nivell: '4eso', any: null, dificultats: ['2', '3'], sentits: ['mesura', 'estocastic', 'numeric'], modeExamen: true, ids: [101, 205, 310], resultatsExamen: enc([101, 205, 310], [205, 310]), intentsPerPregunta: {}, notaSobre10: 10 / 3 },
        codi: 'Cq27-0401-0800-CB-2-1-03-00-6-21-GDIL-033-144000000000000000000000000000',
    },
    {
        nom: 'preguntes triades a mà (q): ids 158,159,160,163',
        entrada: { ara: new Date(2026, 9, 20, 12, 0), nivell: '4eso', any: null, dificultats: [], sentits: [], modeExamen: false, ids: [158, 159, 160, 163], resultatsExamen: enc([158, 159, 160, 163]), intentsPerPregunta: {}, notaSobre10: 10 },
        codi: 'Jq26-2010-1200-CB-2-2-04-00-7-31-OUTV-100-111100000000000000000000000000',
    },
    {
        nom: 'les mateixes però amb el 164 en lloc del 163: només canvia l\u2019empremta (i la lletra)',
        entrada: { ara: new Date(2026, 9, 20, 12, 0), nivell: '4eso', any: null, dificultats: [], sentits: [], modeExamen: false, ids: [158, 159, 160, 164], resultatsExamen: enc([158, 159, 160, 164]), intentsPerPregunta: {}, notaSobre10: 10 },
        codi: 'Yq26-2010-1200-CB-2-2-04-00-7-31-NTNO-100-111100000000000000000000000000',
    },
];
console.log('Vectors fixos');
VECTORS.forEach(v => prova(v.nom, () => assert.strictEqual(C.construeix(v.entrada), v.codi)));

// ── 2. Peces ─────────────────────────────────────────────────────────────────
console.log('Màscares, any, empremta i resultats');
prova('dificultats: 1→1, 2→2, 3→4; 1+2→3; 1+3→5; 2+3→6; totes o cap→7', () => {
    const m = l => C.mascara(l, C.DIFICULTATS);
    assert.deepStrictEqual([m(['1']), m(['2']), m(['3']), m(['1', '2']), m(['1', '3']), m(['2', '3']), m(['1', '2', '3']), m([])], [1, 2, 4, 3, 5, 6, 7, 7]);
});
prova('sentits: numèric 1, algebraic 2, de mesura 4, espacial 8, estocàstic 16; tots o cap→31', () => {
    const m = l => C.mascara(l, C.SENTITS);
    assert.deepStrictEqual([m(['numeric']), m(['algebraic']), m(['mesura']), m(['espacial']), m(['estocastic']), m(['numeric', 'algebraic']), m(C.SENTITS), m([])], [1, 2, 4, 8, 16, 3, 31, 31]);
});
prova('un valor desconegut s\u2019ignora; si només n\u2019hi ha de desconeguts, val «tots»', () => {
    assert.strictEqual(C.mascara(['1', '9'], C.DIFICULTATS), 1);
    assert.strictEqual(C.mascara(['9'], C.DIFICULTATS), 7);
    assert.strictEqual(C.mascara([' numeric '], C.SENTITS), 1);
});
prova('any: 2025→25, 2022→22, buit/null/estrany→00', () => {
    assert.deepStrictEqual(['2025', '2022', '', null, undefined, 'abc', '25'].map(C.campAny), ['25', '22', '00', '00', '00', '00', '00']);
});
prova('empremta: 4 lletres A-W, sempre la mateixa per a la mateixa llista', () => {
    const e = C.empremta([1, 2, 3, 4]);
    assert.match(e, /^[A-W]{4}$/);
    assert.strictEqual(e, C.empremta([1, 2, 3, 4]));
});
prova('empremta: l\u2019ordre compta i qualsevol canvi de la llista la canvia', () => {
    const base = C.empremta([1, 2, 3, 4]);
    [[4, 3, 2, 1], [1, 2, 3], [1, 2, 3, 4, 5], [1, 2, 3, 5], [2, 2, 3, 4], [12, 3, 4]].forEach(l => assert.notStrictEqual(C.empremta(l), base, l.join()));
});
prova('empremta: 2000 seleccions diferents donen pocs repetits (≤ 15 de 279841 valors possibles)', () => {
    const vistos = new Set();
    for (let i = 1; i <= 2000; i++) vistos.add(C.empremta([i, i + 1, i + 2, i * 3]));
    assert.ok(2000 - vistos.size <= 15, `n\u2019hi ha ${2000 - vistos.size}`);
});
prova('resultats: examen = 1/4; pràctica = intents 1-4 (7 errors → 4); sense resposta = 0', () => {
    assert.strictEqual(C.resultats({ modeExamen: true, ids: [1, 2, 3], resultatsExamen: enc([1, 2, 3], [2]) }).slice(0, 4), '141' + '0');
    const pr = C.resultats({ modeExamen: false, ids: [1, 2, 3, 4], resultatsExamen: enc([1, 2, 3]), intentsPerPregunta: { 2: 1, 3: 7 } });
    assert.strictEqual(pr.slice(0, 5), '12400'); // la 4a no s\u2019ha contestat
});
prova('resultats: 30 posicions fins a 30 preguntes, 40 de 31 a 40, i per sobre de 40 es reté', () => {
    const r = n => C.resultats({ modeExamen: true, ids: rang(n), resultatsExamen: enc(rang(n)) }).length;
    assert.deepStrictEqual([r(1), r(30), r(31), r(40), r(45)], [30, 30, 40, 40, 40]);
});

// ── 3. La lletra de control ──────────────────────────────────────────────────
console.log('Lletra de control');
// Alfabet permès a cada posició del cos: CB (fix) · curs · mode · QQ · AA · F · SS · EEEE · resultats
const ALFABETS = cos => {
    const camps = [[2, null], [1, '0123'], [1, '12'], [2, '0123456789'], [2, '0123456789'], [1, '1234567'], [2, '0123456789'], [4, C.ALFABET_EMPREMTA]];
    const fixos = camps.reduce((a, [n]) => a + n, 0);
    camps.push([cos.length - fixos, '01234']);
    return camps.flatMap(([n, a]) => Array.from({ length: n }, () => a));
};
VECTORS.forEach(v => {
    prova('canviar un sol caràcter del cos canvia sempre la lletra · ' + v.nom.slice(0, 40), () => {
        const codi = v.codi,
            p = codi.split('-');
        const [cap, dm, hm, ex, d, s, qq, any, dif, sent, emp, nnn, res] = p;
        const salt = cap.slice(1);
        const dd = +dm.slice(0, 2), mm = +dm.slice(2), hh = +hm.slice(0, 2), mn = +hm.slice(2);
        const cos = `${ex}${d}${s}${qq}${any}${dif}${sent}${emp}${res}`;
        const lletra = C.lletraControl(+nnn, dd, mm, hh, mn, salt, cos);
        assert.strictEqual(lletra, cap[0], 'el vector ha de quadrar amb la seva lletra');
        const alf = ALFABETS(cos);
        assert.strictEqual(alf.length, cos.length, 'longitud del cos');
        let provats = 0;
        for (let i = 2; i < cos.length; i++) {
            for (const c of alf[i]) {
                if (c === cos[i]) continue;
                const mod = cos.slice(0, i) + c + cos.slice(i + 1);
                assert.notStrictEqual(C.lletraControl(+nnn, dd, mm, hh, mn, salt, mod), lletra, `posició ${i}: ${cos[i]}→${c}`);
                provats++;
            }
        }
        assert.ok(provats > 100, 'ha de provar moltes mutacions');
    });
});

console.log(`\n${fets} proves correctes${process.exitCode ? ' (però n\u2019hi ha de fallides)' : ''}`);
