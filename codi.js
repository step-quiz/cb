/**
 * ============================================================================
 * PROJECTE: Step Quiz — Competències Bàsiques (cb)
 * FITXER: codi.js
 * ROL: El codi de verificació que l'alumne lliura en acabar la prova (format v3).
 *      Lògica pura, sense DOM: la fa servir core.js (finalitzarProva) i la
 *      comprova tests/codi.test.js.
 *
 *   Lsss-DDMM-HHMM-CB-D-S-QQ-AA-F-SS-EEEE-NNN-RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
 *
 *   Respecte del v2 (9 segments) hi ha quatre camps nous després de QQ, que
 *   diuen què s'havia triat a l'enllaç de la prova:
 *     AA    convocatòria: els dos últims dígits de l'any (25), o 00 = tots els anys
 *     F     dificultats, com a suma: 1 baixa, 2 mitjana, 4 alta (7 = totes)
 *     SS    sentits, com a suma de dues xifres: 1 numèric, 2 algebraic, 4 de mesura,
 *           8 espacial, 16 estocàstic (31 = tots)
 *     EEEE  empremta de la llista d'ids de les preguntes, en ordre (4 lletres A-W)
 *   Els altres camps (D curs, S mode, QQ preguntes, NNN nota, R resultats) i el
 *   salt `sss` són com al v2: vegeu el README.
 *
 *   La lletra de control és la d'operacions (js/codi-verificacio.js, lletraNova)
 *   aplicada a un cos més llarg: cos = CB + D + S + QQ + AA + F + SS + EEEE + R…
 *   Si es toca aquí, cal tocar-la allà, i els vectors de tests/codi.test.js
 *   (que són els mateixos que els de tests/codi-verificacio.test.js d'operacions)
 *   ho comproven.
 * ============================================================================
 */
(function (arrel) {
    'use strict';

    const LLETRES_CONTROL = 'TRWAGMYFPDXBNJZSQVHLCKE';
    // 23 lletres seguides (ASCII 65-87): canviar-ne una de sola mai deixa igual la lletra de control.
    const ALFABET_EMPREMTA = 'ABCDEFGHIJKLMNOPQRSTUVW';
    const VALORS_EMPREMTA = Math.pow(ALFABET_EMPREMTA.length, 4); // 23^4 = 279841

    // L'ordre és el dels bits: el primer val 1, el segon 2, el tercer 4...
    const DIFICULTATS = ['1', '2', '3'];
    const SENTITS = ['numeric', 'algebraic', 'mesura', 'espacial', 'estocastic'];

    /**
     * Màscara d'una llista de valors triats. Llista buida (o sense cap valor conegut)
     * vol dir «tots»: tots els bits a 1.
     */
    function mascara(llista, taula) {
        const tots = (1 << taula.length) - 1;
        let m = 0;
        (llista || []).forEach(v => {
            const i = taula.indexOf(String(v).trim());
            if (i >= 0) m |= 1 << i;
        });
        return m || tots;
    }

    /** Camp AA: «2025» → «25»; sense any (o un valor estrany) → «00». */
    function campAny(filtreAny) {
        return /^\d{4}$/.test(String(filtreAny || '')) ? String(filtreAny).slice(-2) : '00';
    }

    /**
     * Empremta d'una llista d'ids: FNV-1a de 32 bits del text «id,id,id», reduïda a
     * 4 lletres A-W. L'ordre compta (és el de les columnes de l'analitzador).
     */
    function empremta(ids) {
        const text = ids.join(',');
        let h = 0x811c9dc5;
        for (let i = 0; i < text.length; i++) {
            h ^= text.charCodeAt(i);
            h = Math.imul(h, 0x01000193) >>> 0;
        }
        let n = h % VALORS_EMPREMTA;
        let lletres = '';
        for (let i = 0; i < 4; i++) {
            lletres = ALFABET_EMPREMTA.charAt(n % ALFABET_EMPREMTA.length) + lletres;
            n = Math.floor(n / ALFABET_EMPREMTA.length);
        }
        return lletres;
    }

    /**
     * Camp de resultats: una xifra per pregunta. Examen: 1 encert, 4 error. Pràctica:
     * 1r intent = 1, 2n = 2, 3r = 3, fallada = 4, sense resposta = 0.
     * S'omple amb 0 fins a 30 posicions (40 si hi ha més de 30 preguntes; per sobre
     * de 40 es reté: val més perdre el detall de les últimes que no pas que
     * l'analitzador rebutgi el codi sencer i es perdi també la nota).
     */
    function resultats({ modeExamen, ids, resultatsExamen, intentsPerPregunta }) {
        let r = '';
        if (modeExamen) {
            resultatsExamen.forEach(x => {
                r += x.encertat ? '1' : '4';
            });
        } else {
            // En l'ús normal no n'hi pot haver cap sense resposta (només s'avança encertant),
            // però si mai s'arribés aquí abans d'hora, una pregunta no resposta ha de sortir
            // com a 0 (com a l'examen), no com a «1r intent».
            const respostes = new Set(resultatsExamen.map(x => x.id));
            ids.forEach(id => {
                if (!respostes.has(id)) {
                    r += '0';
                    return;
                }
                const errors = (intentsPerPregunta && intentsPerPregunta[id]) || 0;
                r += String(Math.min(errors + 1, 4));
            });
        }
        const amplada = r.length > 30 ? 40 : 30;
        return r.slice(0, 40).padEnd(amplada, '0');
    }

    /** Lletra de control: lletraNova() d'operacions (js/codi-verificacio.js) amb el cos del v3. */
    function lletraControl(notaInt, dd, mm, hh, mn, salt, cos) {
        let sumaCos = 0;
        for (let i = 0; i < cos.length; i++) sumaCos += ((i % 22) + 1) * cos.charCodeAt(i);
        const suma = notaInt + dd + mm + hh + mn + salt.charCodeAt(0) + sumaCos;
        return LLETRES_CONTROL.charAt(suma % 23);
    }

    /**
     * El codi de verificació v3.
     *   ara                 Date del moment d'acabar la prova
     *   nivell              '2eso', '4eso' o null (tots)
     *   any                 filtre d'any de l'enllaç ('2025') o null
     *   dificultats         llista de dificultats triades ('1','2','3'); buida = totes
     *   sentits             llista de sentits triats; buida = tots
     *   modeExamen          true = examen (sense pistes), false = pràctica
     *   ids                 ids de les preguntes de la prova, en ordre
     *   resultatsExamen     [{ id, encertat }] de les preguntes contestades
     *   intentsPerPregunta  { id: nombre d'errors } (pràctica)
     *   notaSobre10         nota de 0 a 10
     */
    function construeix(d) {
        const dd = d.ara.getDate(),
            mm = d.ara.getMonth() + 1,
            hh = d.ara.getHours(),
            mn = d.ara.getMinutes();
        const dos = n => String(n).padStart(2, '0');

        // Salt: 'q' = 4t ESO, 's' = 2n ESO o sense nivell + any en què es FA la prova.
        const salt = (d.nivell === '4eso' ? 'q' : 's') + String(d.ara.getFullYear()).slice(-2);
        const exCode = 'CB';
        const curs = d.nivell === '2eso' ? '1' : d.nivell === '4eso' ? '2' : '0';
        const mode = d.modeExamen ? '1' : '2';
        const qq = dos(Math.min(d.ids.length, 99));
        const any = campAny(d.any);
        const dif = String(mascara(d.dificultats, DIFICULTATS));
        const sent = dos(mascara(d.sentits, SENTITS));
        const emp = empremta(d.ids);
        const notaInt = Math.round(d.notaSobre10 * 10);
        const res = resultats(d);

        const cos = `${exCode}${curs}${mode}${qq}${any}${dif}${sent}${emp}${res}`;
        const lletra = lletraControl(notaInt, dd, mm, hh, mn, salt, cos);
        return `${lletra}${salt}-${dos(dd)}${dos(mm)}-${dos(hh)}${dos(mn)}-${exCode}-${curs}-${mode}-${qq}-${any}-${dif}-${sent}-${emp}-${String(notaInt).padStart(3, '0')}-${res}`;
    }

    const CodiCB = { construeix, mascara, campAny, empremta, resultats, lletraControl, DIFICULTATS, SENTITS, ALFABET_EMPREMTA };
    if (typeof module !== 'undefined' && module.exports) module.exports = CodiCB;
    else arrel.CodiCB = CodiCB;
})(typeof window !== 'undefined' ? window : this);
