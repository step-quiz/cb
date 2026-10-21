/**
 * CORE.JS - Versió optimitzada per a dades externes (JSON)
 * Adaptat per a estructura d'activitats (1 enunciat : N preguntes)
 */

// ==========================================
// 1. CONFIGURACIÓ DE MODES I FILTRES
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
// p=1 → pràctica (amb pistes) · p=0 → examen · p=2 → examen sense nota final
const modeParam = urlParams.get('p');
const modeExamen = modeParam !== '1';   // p=0 i p=2 funcionen exactament com un examen
const mostrarNota = modeParam !== '2';  // p=2: en acabar no es mostra la nota, però sí el codi
const etiquetaMode = modeExamen ? "Mode examen" : "Mode pràctica";

const filtreAny = urlParams.get('any');
const filtreNivell = urlParams.get('nivell');
// "numeric", "numeric,algebraic"... -> ['numeric','algebraic']; sense el paràmetre, tots els sentits
const filtreSentit = (urlParams.get('sentit') || '').split(',').map(d => d.trim()).filter(Boolean);
// "1", "1,2", "1,3"... -> ['1','3']; sense el paràmetre, totes les dificultats
const filtreDificultat = (urlParams.get('dificultat') || '').split(',').map(d => d.trim()).filter(Boolean);
const filtreMax = urlParams.get('max');
const filtreQ = urlParams.get('q');

// "158-160,163" -> Set {158,159,160,163}
function expandeixIds(text) {
    const conjunt = new Set();
    text.split(',').forEach(tros => {
        const m = /^(\d+)(?:-(\d+))?$/.exec(tros.trim());
        if (!m) return;
        const a = Number(m[1]);
        const b = m[2] ? Number(m[2]) : a;
        for (let i = Math.min(a, b); i <= Math.max(a, b); i++) conjunt.add(i);
    });
    return conjunt;
}

// Títol dinàmic segons el nivell
const titolsNivell = {
    '4eso': 'Matemàtiques 4t ESO',
    '2eso': 'Matemàtiques 2n ESO'
};
const titolElement = document.getElementById('titol-principal');
if (titolElement && filtreNivell && titolsNivell[filtreNivell]) {
    titolElement.textContent = titolsNivell[filtreNivell];
    document.title = titolsNivell[filtreNivell] + ' — Competències Bàsiques';
}

// Estat de l'aplicació
let preguntesActives = []; 
let preguntaActual = 0;
let intentsPerPregunta = {}; 
let resultatsExamen = [];
let ultimEnunciatCarregat = ""; // Per evitar parpelleigs si l'enunciat és el mateix
let tipusErrors = {}; // errors.json: nom de cada tipus d'error (si no carrega, no es mostra l'etiqueta)

// ==========================================
// 2. CÀRREGA DE DADES (FETCH) I FILTRATGE
// ==========================================
async function inicialitzarApp() {
    try {
        const resposta = await fetch('preguntes.json'); 
        if (!resposta.ok) throw new Error("No s'ha pogut trobar el fitxer preguntes.json");
        
        const dadesTotals = await resposta.json();

        // Taxonomia d'errors (només per al mode pràctica). Si falla, el joc funciona igual.
        if (!modeExamen) {
            try {
                const r = await fetch('errors.json');
                if (r.ok) tipusErrors = await r.json();
            } catch (e) { console.warn("No s'ha pogut carregar errors.json", e); }
        }

        // Filtratge segons paràmetres URL
        preguntesActives = dadesTotals.filter(p => {
            let compleix = true;
            if (filtreAny && p.any.toString() !== filtreAny) compleix = false;
            if (filtreNivell && p.nivell !== filtreNivell) compleix = false;
            if (filtreSentit.length && !filtreSentit.includes(p.sentit)) compleix = false;
            if (filtreDificultat.length && !filtreDificultat.includes(p.dificultat.toString())) compleix = false;
            return compleix;
        });
        
        // Tria explícita de preguntes (paràmetre q). Es respecta l'ordre del banc.
        if (filtreQ) {
            const permesos = expandeixIds(filtreQ);
            if (permesos.size) preguntesActives = preguntesActives.filter(p => permesos.has(p.id));
        }

        if (filtreMax && !isNaN(filtreMax)) {
            preguntesActives = preguntesActives.slice(0, parseInt(filtreMax));
        }

        if (preguntesActives.length === 0) {
            mostrarError("No s'han trobat preguntes amb els filtres seleccionats.");
        } else {
            carregarPregunta();
        }

    } catch (error) {
        console.error(error);
        mostrarError("Error al carregar la base de dades. Revisa que el fitxer 'preguntes.json' existeixi i sigui vàlid.");
    }
}

// ==========================================
// 3. LÒGICA DE VISUALITZACIÓ
// ==========================================
function carregarPregunta() {
    const dades = preguntesActives[preguntaActual];
    
    // Referències DOM
    const imgEnunciat = document.getElementById('img-enunciat');
    const imgPregunta = document.getElementById('img-pregunta');
    const opcionsContainer = document.getElementById('opcions-container');
    const comptador = document.getElementById('comptador-preguntes');
    const btnSeguent = document.getElementById('btn-seguent');

    // 1. Gestionar l'ENUNCIAT (Evitar parpelleig si és el mateix de l'activitat anterior)
    if (ultimEnunciatCarregat !== dades.enunciat) {
        imgEnunciat.classList.remove('visible');
        setTimeout(() => {
            imgEnunciat.src = dades.enunciat;
            imgEnunciat.style.display = 'block';
            imgEnunciat.onload = () => imgEnunciat.classList.add('visible');
            ultimEnunciatCarregat = dades.enunciat;
        }, 300);
    }

    // 2. Gestionar la PREGUNTA (Sempre canvia)
    imgPregunta.classList.remove('visible');
    opcionsContainer.classList.remove('visible');
    btnSeguent.style.display = 'none';

    setTimeout(() => {
        imgPregunta.src = dades.pregunta;
        imgPregunta.style.display = 'block';
        imgPregunta.onload = () => {
            imgPregunta.classList.add('visible');
            setTimeout(() => generatBotonsOpcions(dades), 400);
        };
    }, 400);

    // 3. Actualitzar comptador AMB INDICADOR DE MODE
    // Utilitzem innerHTML per poder posar el <span> amb l'etiqueta
    comptador.innerHTML = `
        <span style="margin-right: 20px; font-weight: bold; opacity: 0.8;">${etiquetaMode}</span>
        Pregunta ${preguntaActual + 1} de ${preguntesActives.length}
    `;
    comptador.classList.remove('fade-out');
}

function generatBotonsOpcions(dades) {
    const container = document.getElementById('opcions-container');
    container.innerHTML = '';
    const lletres = ["A", "B", "C", "D"];

    lletres.forEach((lletra, index) => {
        const fila = document.createElement('div');
        fila.className = 'fila-opcio';

        const btn = document.createElement('button');
        btn.className = 'opcio';
        btn.innerText = `Opció ${lletra}`;
        
        const espaiPista = document.createElement('div');
        espaiPista.className = 'pista-contextual';
        espaiPista.id = `pista-${index}`;

        btn.onclick = () => {
            if (modeExamen) seleccionarExamen(index, btn, espaiPista);
            else validarPractica(index, btn, espaiPista);
        };

        fila.appendChild(btn);
        fila.appendChild(espaiPista);
        container.appendChild(fila);
    });

    container.classList.add('visible');
}

// ==========================================
// 4. MODES DE JOC (PRÀCTICA I EXAMEN)
// ==========================================
function validarPractica(index, btn, espai) {
    const dades = preguntesActives[preguntaActual];
    if (!intentsPerPregunta[dades.id]) intentsPerPregunta[dades.id] = 0;

    if (index === dades.indexCorrecte) {
        btn.classList.add('correcta');
        espai.innerHTML = "✅ Molt bé!";
        espai.className = "pista-contextual success-msg";
        
        resultatsExamen.push({ id: dades.id, encertat: intentsPerPregunta[dades.id] === 0 });
        bloquejarOpcions();
        prepararSeguent(true);
    } else {
        intentsPerPregunta[dades.id]++;
        btn.disabled = true;
        btn.classList.add('incorrecta');
        
        // Esborrem el text de qualsevol pista que s'hagi mostrat abans en aquesta pregunta
        document.querySelectorAll('.pista-contextual').forEach(p => p.innerText = '');

        // Tipus d'error de l'opció triada (errors.json), damunt de la pista
        const tipus = dades.errors && tipusErrors[dades.errors[index]];
        if (tipus) {
            const etiqueta = document.createElement('span');
            etiqueta.className = 'etiqueta-error';
            etiqueta.textContent = tipus.nom;
            etiqueta.title = tipus.descripcio;
            espai.appendChild(etiqueta);
        }
        espai.appendChild(document.createTextNode(dades.pistes[index])); // Mostra la nova pista
    }
}

function seleccionarExamen(index, btn, espai) {
    document.querySelectorAll('.opcio').forEach(b => b.classList.remove('seleccionada'));
    document.querySelectorAll('.btn-confirmar').forEach(b => b.remove());

    btn.classList.add('seleccionada');
    const btnConf = document.createElement('button');
    btnConf.innerText = "Confirmar";
    btnConf.className = "btn-confirmar";
    
    btnConf.onclick = () => {
        // --- SOLUCIÓ AL BUG DEL DOBLE CLIC ---
        // 1. Deshabilitem el botó immediatament perquè no es pugui tornar a clicar
        btnConf.disabled = true;
        // 2. Li canviem el text per donar feedback a l'alumne
        btnConf.innerText = "⏳ Guardant..."; 
        // 3. Bloquegem tota la resta d'opcions de la pantalla per seguretat total
        bloquejarOpcions();
        // -------------------------------------

        const dades = preguntesActives[preguntaActual];
        resultatsExamen.push({ id: dades.id, encertat: (index === dades.indexCorrecte) });
        prepararSeguent(false);
    };
    
    // En mòbil horitzontal, posem el Confirmar a l'esquerra (A/B) o dreta (C/D)
    if (esMobilHoritzontal() && (index === 0 || index === 1)) {
        const fila = btn.closest('.fila-opcio');
        fila.insertBefore(btnConf, fila.firstChild);
    } else {
        espai.appendChild(btnConf);
    }
}

// ==========================================
// 5. TRANSICIONS I FINALITZACIÓ
// ==========================================
function prepararSeguent(ambClic) {
    const btnSeguent = document.getElementById('btn-seguent');
    const esUltima = preguntaActual === preguntesActives.length - 1;

    // 1. Configurem què farà el botó si es mostra
    if (esUltima) {
        btnSeguent.innerText = "Finalitzar i veure resultats";
        btnSeguent.onclick = finalitzarProva;
    } else {
        btnSeguent.innerText = "Següent pregunta"; // Restablim el text per si de cas
        btnSeguent.onclick = seguentPregunta;
    }
    
    // 2. Decidim si esperem al clic de l'alumne o saltem automàticament
    if (ambClic) {
        btnSeguent.style.display = 'block';
        // En mòbil horitzontal, fem scroll suau perquè es vegi el botó
        if (esMobilHoritzontal()) {
            setTimeout(() => btnSeguent.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
        }
    } else {        // Si és automàtic (Mode Examen), comprovem si toca avançar o acabar
        if (esUltima) {
            finalitzarProva();
        } else {
            seguentPregunta();
        }
    }
}

function seguentPregunta() {
    document.getElementById('comptador-preguntes').classList.add('fade-out');
    preguntaActual++;
    // En mòbil horitzontal, tornem a dalt perquè la nova pregunta es vegi sencera
    if (esMobilHoritzontal()) {
        document.getElementById('columna-b').scrollTo({ top: 0, behavior: 'smooth' });
    }
    carregarPregunta();
}

function finalitzarProva() {
    // 1. Amagar interfície de joc
    document.getElementById('zona-pregunta').style.display = 'none';
    document.getElementById('opcions-container').style.display = 'none';
    document.getElementById('comptador-preguntes').style.display = 'none';
    document.getElementById('btn-seguent').style.display = 'none';

    // 2. Mostrar la pantalla final
    document.getElementById('pantalla-final').style.display = 'block';

    // 3. Generació del codi de verificació — FORMAT v3
    // ---------------------------------------------------------------
    // El construeix codi.js (lògica pura, amb tests/codi.test.js). Format:
    // Lsss-DDMM-HHMM-CB-D-S-QQ-AA-F-SS-EEEE-NNN-RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
    // Respecte del v2 hi ha la convocatòria, les dificultats, els sentits i una
    // empremta de les preguntes: vegeu el README i la capçalera de codi.js.
    // L'analitzador-stepquiz.html (operacions) el parseja com a format 'v3'.
    // ---------------------------------------------------------------

    const total = preguntesActives.length;
    const encerts = resultatsExamen.filter(r => r.encertat).length;
    const notaSobre10 = (encerts / total) * 10;

    const codiFinal = CodiCB.construeix({
        ara: new Date(),
        nivell: filtreNivell,
        any: filtreAny,
        dificultats: filtreDificultat,
        sentits: filtreSentit,
        modeExamen,
        ids: preguntesActives.map(p => p.id),
        resultatsExamen,
        intentsPerPregunta,
        notaSobre10
    });

    // ── Nota amb coma per mostrar a pantalla ──
    const notaDisplay = notaSobre10.toFixed(2).replace('.', ',');

    // 5. Visualització del Resum i Codi
    document.getElementById('resum-detallat').style.display = 'block';
    document.querySelector('.caixa-codi').style.display = 'block';
    
    // Construïm el resum de forma segura (sense injectar text de la URL com a HTML)
    const resumDiv = document.getElementById('resum-detallat');
    resumDiv.innerHTML = ''; // Netegem

    const pNivell = document.createElement('p');
    pNivell.textContent = 'Has completat la prova de: ';
    const strong1 = document.createElement('strong');
    strong1.textContent = filtreNivell || 'Matemàtiques';
    pNivell.appendChild(strong1);
    resumDiv.appendChild(pNivell);

    if (modeExamen && mostrarNota) {
        const pNota = document.createElement('p');
        pNota.innerHTML = `Nota: <span style="font-size:1.5rem; color:var(--primary)"><strong>${notaDisplay}</strong></span>`;
        resumDiv.appendChild(pNota);
    }    
    const caixaCodi = document.querySelector('.caixa-codi');
    caixaCodi.innerHTML = `
        <p>Copia el codi i lliura'l al professor:</p>
        <button id="btn-copiar-codi" class="btn-confirmar" style="font-size: 1.2rem; padding: 15px 25px; font-family: monospace; letter-spacing: 1px; cursor: pointer; word-break: break-all;">
        </button>
        <div id="msg-copiat" style="display: none; color: #28a745; margin-top: 15px; font-weight: bold; font-size: 1.1rem;">
            Copiat! ✅
        </div>
    `;
    const btnCodi = document.getElementById('btn-copiar-codi');
    btnCodi.textContent = codiFinal;
    btnCodi.addEventListener('click', () => copiarCodi(codiFinal));
}

// ==========================================
// UTILS
// ==========================================
function esMobilHoritzontal() {
    return window.matchMedia('(max-height: 450px) and (orientation: landscape) and (hover: none)').matches;
}

function bloquejarOpcions() {
    document.querySelectorAll('.opcio').forEach(b => b.disabled = true);
}

function mostrarError(msg) {
    document.getElementById('columna-b').innerHTML = `
        <div style="text-align:center; padding:50px; color:var(--error);">
            <h2>⚠️ Problema tècnic</h2>
            <p>${msg}</p>
        </div>
    `;
}

function copiarCodi(codi) {
    navigator.clipboard.writeText(codi).then(() => {
        const btn = document.getElementById('btn-copiar-codi');
        const msg = document.getElementById('msg-copiat');
        
        // Donem feedback visual canviant el color del botó a verd fosc momentàniament
        btn.style.backgroundColor = '#28a745';
        btn.style.borderColor = '#28a745';
        
        // Mostrem el missatge amb la icona
        msg.style.display = 'block';
        
        // Restaurem l'estat original passats uns segons perquè l'alumne sàpiga que ja pot marxar
        setTimeout(() => {
            btn.style.backgroundColor = ''; // Torna al color CSS per defecte
            btn.style.borderColor = '';
            msg.style.display = 'none';
        }, 2500);
    });
}

// ARRENCADA
inicialitzarApp();
