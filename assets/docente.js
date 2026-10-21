// Panel docente: trae las respuestas desde Apps Script y calcula métricas por habilidad, pregunta y grupo.
(function () {
  const CFG = window.DIAG_CONFIG || {};
  const { AUTO, MANUAL, HABILIDADES, NIVELES, evaluarItem, nivelHabilidad } = window.CLAVE;
  const ITEMS = window.SECCIONES.flatMap(s => s.items);
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pct = (a, b) => b ? Math.round(100 * a / b) : 0;

  let registros = [], demo = false, clave = "";
  try { clave = sessionStorage.getItem("diagSST.clave") || ""; } catch (e) { /* nada */ }

  async function api(cuerpo) {
    const res = await fetch(CFG.API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(cuerpo) });
    const datos = await res.json();
    if (!datos.ok) throw new Error(datos.error || "Error del servidor");
    return datos;
  }

  async function cargar() {
    const msg = $("#msg-acceso");
    if (!CFG.API_URL) { msg.innerHTML = `<p class="error">Falta conectar la hoja de resultados: pega la URL de Apps Script en <code>assets/config.js</code>. Mientras tanto, puedes ver el panel con datos de ejemplo.</p>`; return; }
    msg.innerHTML = `<p class="pequeno">Cargando…</p>`;
    try {
      const datos = await api({ accion: "resultados", clave });
      registros = datos.registros; demo = false;
      try { sessionStorage.setItem("diagSST.clave", clave); } catch (e) { /* nada */ }
      mostrarPanel();
    } catch (e) {
      msg.innerHTML = `<p class="error">No se pudieron cargar los resultados: ${esc(e.message)}.</p>`;
    }
  }

  $("#btn-entrar").addEventListener("click", () => { clave = $("#clave").value; cargar(); });
  $("#clave").addEventListener("keydown", e => { if (e.key === "Enter") { clave = $("#clave").value; cargar(); } });
  $("#btn-demo").addEventListener("click", () => { registros = window.generarDemo(); demo = true; mostrarPanel(); });
  $("#btn-actualizar").addEventListener("click", () => demo ? mostrarPanel() : cargar());
  $("#btn-salir").addEventListener("click", () => { try { sessionStorage.removeItem("diagSST.clave"); } catch (e) { /* nada */ } location.reload(); });
  $("#btn-csv").addEventListener("click", descargarCSV);
  document.querySelectorAll(".pestanas button").forEach(b => b.addEventListener("click", () => abrirTab(b.dataset.tab)));
  if (clave && CFG.API_URL) cargar();

  function abrirTab(id) {
    document.querySelectorAll(".pestanas button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab === id)));
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("oculto", t.id !== "tab-" + id));
  }

  function minutos(r) {
    const m = (new Date(r.fin) - new Date(r.inicio)) / 60000;
    return isFinite(m) && m > 0 && m < 300 ? m : null;
  }

  function mostrarPanel() {
    $("#acceso").classList.add("oculto");
    $("#panel").classList.remove("oculto");
    $("#acciones-top").classList.remove("oculto");
    $("#aviso-demo").classList.toggle("oculto", !demo);
    $("#txt-actualizado").textContent = `Actualizado: ${new Date().toLocaleString("es-CO")} · ${registros.length} respuesta(s).`;
    pintarKPIs(); pintarResumen(); pintarPreguntas(); pintarRevisar(); pintarExperiencia(); pintarEstudiantes();
  }

  // ── KPIs
  function pintarKPIs() {
    const n = registros.length;
    const tiempos = registros.map(minutos).filter(m => m != null);
    const tProm = tiempos.length ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : "—";
    const evaluables = ITEMS.filter(it => !it.id.startsWith("E")).map(it => it.id);
    let nose = 0, blanco = 0, total = 0, auto = 0, autoPts = 0, pend = 0;
    registros.forEach(r => evaluables.forEach(id => {
      const e = evaluarItem(r, id); total++;
      if (e.estado === "nose") nose++;
      if (e.estado === "blanco") blanco++;
      if (e.estado === "pendiente") pend++;
      if (AUTO[id]) { auto++; autoPts += e.puntaje || 0; }
    }));
    const k = [
      [n, "respuestas recibidas"],
      [tProm === "—" ? "—" : tProm + " min", "tiempo promedio de respuesta"],
      [pct(total - nose - blanco, total) + " %", "preguntas respondidas"],
      [pct(nose, total) + " %", "marcadas como «No sé»"],
      [pct(autoPts, auto) + " %", "aciertos en preguntas autocorregibles"],
      [pend, "respuestas abiertas por revisar"],
    ];
    $("#kpis").innerHTML = k.map(([v, e]) => `<div class="kpi"><div class="valor">${esc(v)}</div><div class="etiqueta">${esc(e)}</div></div>`).join("");
  }

  const leyenda = `<div class="leyenda">${Object.values(NIVELES).map(nv => `<span><i class="c-${nv.clase}"></i>${nv.nombre}</span>`).join("")}</div>`;
  function apilada(conteos, total) {
    return `<div class="apilada">${["ev", "ca", "ac", "pe"].map(k => conteos[k]
      ? `<div class="c-${k}" style="width:${100 * conteos[k] / total}%" title="${NIVELES[k].nombre}: ${conteos[k]}">${conteos[k]}</div>` : "").join("")}</div>`;
  }

  // ── Resumen por habilidad y apoyos sugeridos
  function pintarResumen() {
    const n = registros.length;
    if (!n) { $("#tab-resumen").innerHTML = `<div class="tarjeta"><p>Todavía no hay respuestas.</p></div>`; return; }
    const filas = [], apoyos = [];
    HABILIDADES.forEach(h => {
      const c = { ev: 0, ca: 0, ac: 0, pe: 0 };
      registros.forEach(r => c[nivelHabilidad(r, h)]++);
      filas.push(`<div class="fila-barra"><div class="nom">${esc(h.nombre)}</div>${apilada(c, n)}<div class="pequeno">${n}</div></div>`);
      const evaluados = n - c.pe;
      if (evaluados && (c.ac / evaluados >= 0.3 || (c.ac + c.ca) / evaluados >= 0.5))
        apoyos.push(`<div class="apoyo"><strong>${esc(h.nombre)}:</strong> ${pct(c.ac + c.ca, evaluados)} % de las hojas evaluadas está en camino o necesita acompañamiento. ${esc(h.apoyo)}</div>`);
    });
    // Excel y confianza como habilidades de contexto
    const nunca = registros.filter(r => campo(r, "E1", "frec") === "Nunca").length;
    if (pct(nunca, n) >= 25) apoyos.push(`<div class="apoyo"><strong>Uso de Excel:</strong> ${pct(nunca, n)} % nunca lo ha usado. Conviene un taller inicial de manejo básico y trabajo en parejas mixtas.</div>`);
    const baja = registros.filter(r => ["1", "2"].includes(campo(r, "E2", "v"))).length;
    if (pct(baja, n) >= 30) apoyos.push(`<div class="apoyo"><strong>Confianza:</strong> ${pct(baja, n)} % se siente poco cómodo(a) con los cálculos. Usa ejemplos resueltos paso a paso y revisión sin exponer a nadie.</div>`);

    $("#tab-resumen").innerHTML = `
      <div class="tarjeta"><h2>Nivel del grupo por habilidad</h2>
        <p class="pequeno">Cada barra cuenta hojas, no personas etiquetadas. «Pendiente de revisar» aparece mientras falten calificaciones de respuestas abiertas (pestaña «Revisar respuestas abiertas»).</p>
        ${leyenda}${filas.join("")}
        <p class="pequeno">Criterio: promedio de la habilidad ≥ 70 % se evidencia; 40–69 % en camino; &lt; 40 % necesita acompañamiento. «No sé» y blanco cuentan como 0.</p>
      </div>
      <div class="tarjeta"><h2>Apoyos sugeridos</h2>
        ${apoyos.length ? apoyos.join("") : `<p>Ninguna habilidad supera los umbrales de alerta con los datos actuales.</p>`}
      </div>`;
  }

  function campo(r, id, c) { const x = (r.respuestas || {})[id]; return x && x.campos ? x.campos[c] : undefined; }

  // ── Por pregunta
  function pintarPreguntas() {
    const n = registros.length || 1;
    const filas = ITEMS.filter(it => !it.id.startsWith("E")).map(it => {
      const c = { correcta: 0, parcial: 0, incorrecta: 0, nose: 0, blanco: 0, pendiente: 0 };
      const errores = {};
      registros.forEach(r => {
        const e = evaluarItem(r, it.id); c[e.estado] = (c[e.estado] || 0) + 1;
        if (AUTO[it.id] && (e.estado === "incorrecta" || e.estado === "parcial")) {
          const campos = r.respuestas[it.id].campos || {};
          const clave = String(AUTO[it.id].resumen(campos) || "").slice(0, 60);
          errores[clave] = errores[clave] || { n: 0, exp: AUTO[it.id].error(campos) };
          errores[clave].n++;
        }
      });
      const top = Object.entries(errores).sort((a, b) => b[1].n - a[1].n).slice(0, 3)
        .map(([v, o]) => `<li>«${esc(v)}» · ${o.n}${o.exp ? ` — ${esc(o.exp)}` : ""}</li>`).join("");
      const tipo = AUTO[it.id] ? (AUTO[it.id].aprox ? "Automática (aprox.)" : "Automática") : "Manual";
      const esperado = AUTO[it.id] ? AUTO[it.id].esperado : MANUAL[it.id].guia;
      return `<tr><td><strong>${it.id}</strong><br><span class="pequeno">${tipo}</span></td><td>${esc(esperado)}</td>
        <td class="num"><div class="simple" style="min-width:70px"><div style="width:${pct(c.correcta, n)}%"></div></div>${pct(c.correcta, n)} %</td>
        <td class="num">${pct(c.parcial, n)} %</td><td class="num">${pct(c.incorrecta, n)} %</td><td class="num">${pct(c.nose, n)} %</td>
        <td class="num">${pct(c.blanco, n)} %</td><td class="num">${c.pendiente ? pct(c.pendiente, n) + " %" : "—"}</td>
        <td>${top ? `<ul class="errores">${top}</ul>` : "—"}</td></tr>`;
    });
    $("#tab-preguntas").innerHTML = `<div class="tarjeta"><h2>Resultados por pregunta</h2>
      <p class="pequeno">Las preguntas de texto se califican a mano; C1 y C2 tienen una corrección automática aproximada por palabras clave: revísalas si ves algo raro.</p>
      <div class="tabla-scroll"><table class="panel"><thead><tr><th>Pregunta</th><th>Respuesta esperada</th><th>Correcta</th><th>Parcial</th><th>Incorrecta</th><th>No sé</th><th>En blanco</th><th>Por revisar</th><th>Respuestas incorrectas más frecuentes</th></tr></thead>
      <tbody>${filas.join("")}</tbody></table></div></div>`;
  }

  // ── Revisión de respuestas abiertas
  let itemRevision = "D1", mostrarNombres = false;
  function textoRespuesta(r, id) {
    const x = (r.respuestas || {})[id];
    if (!x) return "(en blanco)";
    if (x.nose) return "No sé";
    const c = x.campos || {};
    if (id === "D2") return `${c.op || "(sin opción)"} — ${c.porque || ""}`;
    if (id === "D3") return `1) ${c.i1 || "—"}\n2) ${c.i2 || "—"}`;
    return c.v || "(en blanco)";
  }
  function pintarRevisar() {
    const opciones = Object.keys(MANUAL).map(id => `<option value="${id}" ${id === itemRevision ? "selected" : ""}>${id}. ${esc(ITEMS.find(i => i.id === id).enunciado)}</option>`).join("");
    const d2 = { "Sí": 0, "No": 0, "No estoy seguro(a)": 0 };
    registros.forEach(r => { const o = campo(r, "D2", "op"); if (o in d2) d2[o]++; });
    const lista = registros.map((r, k) => {
      const e = evaluarItem(r, itemRevision);
      const cal = (r.calificaciones || {})[itemRevision] || "";
      const sinTexto = e.estado === "nose" || e.estado === "blanco";
      const etiqueta = mostrarNombres && r.nombre ? esc(r.nombre) : `Hoja ${k + 1}`;
      return `<div class="revision" data-id="${esc(r.id)}"><strong>${etiqueta}</strong>
        <div class="resp">${esc(textoRespuesta(r, itemRevision))}</div>
        ${sinTexto ? `<span class="chip pe">Sin respuesta: cuenta como 0</span>` : `<div class="calif">
          ${[["e", "Se evidencia", "ev"], ["c", "En camino", "ca"], ["n", "Necesita acompañamiento", "ac"]].map(([v, t, cl]) =>
            `<button type="button" data-cal="${v}" class="${cal === v ? "sel " + cl : cl}">${t}</button>`).join("")}
          ${cal ? `<button type="button" data-cal="">Quitar</button>` : ""}</div>`}</div>`;
    }).join("");
    $("#tab-revisar").innerHTML = `<div class="tarjeta"><h2>Revisar respuestas abiertas</h2>
      <div class="campos"><div class="campo"><label for="sel-item">Pregunta</label><select id="sel-item">${opciones}</select></div>
      <div class="campo corto"><label><input type="checkbox" id="chk-nombres" ${mostrarNombres ? "checked" : ""}> Mostrar nombres</label></div></div>
      <p class="apoyo"><strong>Qué buscar:</strong> ${esc(MANUAL[itemRevision].guia)}</p>
      ${itemRevision === "D2" ? `<p><strong>Opción elegida en D2:</strong> Sí ${d2["Sí"]} · No ${d2["No"]} · No estoy seguro(a) ${d2["No estoy seguro(a)"]}</p>` : ""}
      ${lista || "<p>Todavía no hay respuestas.</p>"}</div>`;
    $("#sel-item").addEventListener("change", e => { itemRevision = e.target.value; pintarRevisar(); });
    $("#chk-nombres").addEventListener("change", e => { mostrarNombres = e.target.checked; pintarRevisar(); });
    $("#tab-revisar").querySelectorAll("[data-cal]").forEach(b => b.addEventListener("click", () => calificar(b.closest(".revision").dataset.id, b.dataset.cal)));
  }

  async function calificar(id, valor) {
    const r = registros.find(x => x.id === id); if (!r) return;
    const previo = Object.assign({}, r.calificaciones || {});
    r.calificaciones = Object.assign({}, previo);
    if (valor) r.calificaciones[itemRevision] = valor; else delete r.calificaciones[itemRevision];
    refrescar();
    if (demo) return;
    try { await api({ accion: "calificar", clave, id, calificaciones: { [itemRevision]: valor } }); }
    catch (e) { r.calificaciones = previo; refrescar(); alert("No se pudo guardar la calificación: " + e.message); }
  }
  function refrescar() {
    const y = window.scrollY;
    pintarKPIs(); pintarResumen(); pintarPreguntas(); pintarRevisar(); pintarEstudiantes();
    window.scrollTo(0, y);
  }

  // ── Excel y confianza
  function barras(conteos, total) {
    return Object.entries(conteos).map(([k, v]) => `<div class="fila-barra"><div class="nom">${esc(k)}</div>
      <div class="simple"><div style="width:${pct(v, total)}%"></div></div><div class="pequeno">${v}</div></div>`).join("");
  }
  function pintarExperiencia() {
    const n = registros.length || 1;
    const frec = { "Nunca": 0, "Algunas veces": 0, "Con frecuencia": 0, "Sin responder": 0 };
    const usos = { "Escribir datos en celdas": 0, "Sumar con una fórmula": 0, "Hacer un gráfico": 0, "Ordenar o filtrar datos": 0 };
    const comodidad = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "Sin responder": 0 };
    const otras = [], e3 = [], e4 = [];
    registros.forEach(r => {
      const f = campo(r, "E1", "frec"); frec[f in frec && f ? f : "Sin responder"]++;
      (campo(r, "E1", "usos") || []).forEach(u => { if (u in usos) usos[u]++; });
      const o = campo(r, "E1", "otra"); if (o) otras.push(o);
      const c = campo(r, "E2", "v"); comodidad[c in comodidad && c ? c : "Sin responder"]++;
      const t3 = campo(r, "E3", "v"); if (t3) e3.push(t3);
      const t4 = campo(r, "E4", "v"); if (t4) e4.push(t4);
    });
    const vals = registros.map(r => parseInt(campo(r, "E2", "v"), 10)).filter(v => v >= 1 && v <= 5);
    const prom = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1).replace(".", ",") : "—";
    const lista = arr => arr.length ? `<ul class="lista-textos">${arr.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : "<p class='pequeno'>Sin respuestas.</p>";
    $("#tab-experiencia").innerHTML = `
      <div class="dos-col">
        <div class="tarjeta"><h2>¿Han usado Excel?</h2>${barras(frec, n)}
          <h3 style="margin-top:18px">Lo que han hecho en Excel</h3>${barras(usos, n)}
          ${otras.length ? `<p class="pequeno">Otras: ${otras.map(esc).join(" · ")}</p>` : ""}</div>
        <div class="tarjeta"><h2>Comodidad con los cálculos</h2><p class="pequeno">1 = nada cómodo · 5 = muy cómodo. Promedio: <strong>${prom}</strong></p>${barras(comodidad, n)}</div>
      </div>
      <div class="dos-col">
        <div class="tarjeta"><h2>Qué les genera inquietud</h2>${lista(e3)}</div>
        <div class="tarjeta"><h2>Qué quieren aprender o hacer con datos</h2>${lista(e4)}</div>
      </div>`;
  }

  // ── Por estudiante
  function pintarEstudiantes() {
    const filas = registros.map((r, k) => {
      const eval_ = ITEMS.filter(it => !it.id.startsWith("E")).map(it => evaluarItem(r, it.id));
      const nose = eval_.filter(e => e.estado === "nose").length, blanco = eval_.filter(e => e.estado === "blanco").length;
      const m = minutos(r);
      return `<tr><td>${k + 1}</td><td>${esc(r.nombre || "(sin nombre)")}</td><td class="num">${m ? Math.round(m) + " min" : "—"}</td>
        ${HABILIDADES.map(h => { const nv = nivelHabilidad(r, h); return `<td><span class="chip ${NIVELES[nv].clase}">${NIVELES[nv].nombre}</span></td>`; }).join("")}
        <td class="num">${nose}</td><td class="num">${blanco}</td><td>${esc(campo(r, "E1", "frec") || "—")}</td><td class="num">${esc(campo(r, "E2", "v") || "—")}</td></tr>`;
    }).join("");
    $("#tab-estudiantes").innerHTML = `<div class="tarjeta"><h2>Por estudiante</h2>
      <p class="alerta">Uso privado de la docente: sirve para planear apoyos individuales. No compartas esta vista ni la uses para etiquetar a nadie.</p>
      <div class="tabla-scroll"><table class="panel"><thead><tr><th>#</th><th>Nombre o código</th><th>Tiempo</th>
      ${HABILIDADES.map(h => `<th>${esc(h.nombre)}</th>`).join("")}<th>No sé</th><th>En blanco</th><th>Excel</th><th>Comodidad</th></tr></thead>
      <tbody>${filas || `<tr><td colspan="12">Todavía no hay respuestas.</td></tr>`}</tbody></table></div></div>`;
  }

  // ── Exportar
  function descargarCSV() {
    const cab = ["fecha", "nombre", "minutos", ...HABILIDADES.map(h => h.nombre)];
    ITEMS.forEach(it => { cab.push(it.id + " respuesta"); if (!it.id.startsWith("E")) cab.push(it.id + " estado"); });
    const celda = v => `"${String(v == null ? "" : v).replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"`;
    const texto = (r, it) => {
      const x = (r.respuestas || {})[it.id]; if (!x) return "";
      if (x.nose) return "No sé";
      return Object.entries(x.campos || {}).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ");
    };
    const filas = registros.map(r => {
      const m = minutos(r);
      const f = [r.fecha, r.nombre, m ? Math.round(m) : "", ...HABILIDADES.map(h => NIVELES[nivelHabilidad(r, h)].nombre)];
      ITEMS.forEach(it => { f.push(texto(r, it)); if (!it.id.startsWith("E")) f.push(evaluarItem(r, it.id).estado); });
      return f.map(celda).join(";");
    });
    const blob = new Blob(["﻿" + [cab.map(celda).join(";"), ...filas].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `diagnostico-sst-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  }
})();
