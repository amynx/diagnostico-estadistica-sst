// Prueba diagnóstica: muestra las preguntas, guarda el avance en el dispositivo y envía las respuestas.
(function () {
  const CFG = window.DIAG_CONFIG || {};
  const SECCIONES = window.SECCIONES;
  const CLAVE_LOCAL = "diagSST.v1";
  const $ = (s, el = document) => el.querySelector(s);

  let estado = cargar() || { id: nuevoId(), nombre: "", inicio: null, respuestas: {}, enviado: false };

  function nuevoId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }
  function cargar() { try { return JSON.parse(localStorage.getItem(CLAVE_LOCAL)); } catch (e) { return null; } }
  function guardar() { try { localStorage.setItem(CLAVE_LOCAL, JSON.stringify(estado)); } catch (e) { /* sin almacenamiento */ } }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  function toast(txt) {
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = txt; t.setAttribute("role", "status");
    document.body.appendChild(t); setTimeout(() => t.remove(), 4500);
  }

  // ── Inicio
  $("#tabla-tiempos").innerHTML = SECCIONES.map(s => `<tr><td style="text-align:left">${s.id}. ${esc(s.titulo)}</td><td>${s.minutos} min</td></tr>`).join("")
    + `<tr><th style="text-align:left">Total</th><th>${SECCIONES.reduce((a, s) => a + s.minutos, 0)} min</th></tr>`;
  $("#nombre").value = estado.nombre || "";

  if (estado.enviado) mostrarGracias();
  else if (estado.inicio) {
    $("#txt-reanudar").textContent = "Ya habías empezado en este dispositivo: continuarás donde ibas.";
    $("#btn-comenzar").textContent = "Continuar la prueba";
  }

  $("#btn-comenzar").addEventListener("click", () => {
    estado.nombre = $("#nombre").value.trim().slice(0, 60);
    if (!estado.inicio) estado.inicio = new Date().toISOString();
    guardar(); comenzar();
  });

  function comenzar() {
    $("#inicio").classList.add("oculto");
    $("#prueba").classList.remove("oculto");
    $("#envio").classList.remove("oculto");
    $("#reloj").classList.remove("oculto");
    $("#progreso").classList.remove("oculto");
    pintarPrueba(); actualizarProgreso(); iniciarReloj();
    window.scrollTo(0, 0);
  }

  // ── Render de preguntas
  function campoHTML(item, c) {
    const nombre = `${item.id}__${c.id}`;
    const etq = c.etiqueta ? `<label for="${nombre}">${esc(c.etiqueta)}</label>` : "";
    const clase = "campo" + (c.corto ? " corto" : "") + (c.tipo === "texto_largo" || c.tipo === "checks" ? " completo" : "");
    switch (c.tipo) {
      case "numero":
        return `<div class="${clase}">${etq || `<label for="${nombre}" class="etq">Respuesta</label>`}<div class="con-sufijo">
          <input type="text" inputmode="decimal" id="${nombre}" name="${nombre}" autocomplete="off">${c.sufijo ? `<span>${esc(c.sufijo)}</span>` : ""}</div></div>`;
      case "texto":
        return `<div class="${clase}">${etq}<input type="text" id="${nombre}" name="${nombre}" maxlength="300" autocomplete="off"></div>`;
      case "texto_largo":
        return `<div class="${clase}">${etq || `<label for="${nombre}" class="etq">Tu respuesta</label>`}<textarea id="${nombre}" name="${nombre}" maxlength="1200"></textarea></div>`;
      case "opciones":
        return `<div class="${clase}">${etq || `<label for="${nombre}" class="etq">Elige una opción</label>`}<select id="${nombre}" name="${nombre}">
          <option value="">— Elige —</option>${c.opciones.map(o => `<option>${esc(o)}</option>`).join("")}</select></div>`;
      case "radio": case "escala":
        return `<div class="campo completo"><div class="opciones" role="radiogroup" aria-label="${esc(item.enunciado)}">
          ${c.opciones.map(o => `<label><input type="radio" name="${nombre}" value="${esc(o)}">${esc(o)}</label>`).join("")}</div></div>`;
      case "checks":
        return `<div class="${clase}"><span class="etq">${esc(c.etiqueta || "")}</span><div class="opciones">
          ${c.opciones.map(o => `<label><input type="checkbox" name="${nombre}" value="${esc(o)}">${esc(o)}</label>`).join("")}</div></div>`;
    }
    return "";
  }

  function pintarPrueba() {
    const form = $("#prueba");
    form.innerHTML = SECCIONES.map(s => `
      <section class="tarjeta" id="seccion-${s.id}">
        <div class="seccion-cab"><h2>Sección ${s.id}. ${esc(s.titulo)}</h2><span class="min">${s.minutos} minutos</span></div>
        ${s.intro}
        ${s.items.map(it => `
          <div class="pregunta" id="p-${it.id}" data-item="${it.id}">
            <p class="enun"><b>${it.id}.</b> ${esc(it.enunciado)}</p>
            ${it.ayuda ? `<p class="ayuda">${esc(it.ayuda)}</p>` : ""}
            <div class="campos">${it.campos.map(c => campoHTML(it, c)).join("")}</div>
            ${s.sinNoSe ? "" : `<div class="nose"><label><input type="checkbox" data-nose="${it.id}"> No sé</label></div>`}
          </div>`).join("")}
      </section>`).join("");

    // Restaurar respuestas guardadas
    SECCIONES.forEach(s => s.items.forEach(it => {
      const r = estado.respuestas[it.id]; if (!r) return;
      it.campos.forEach(c => {
        const v = r.campos && r.campos[c.id]; if (v == null) return;
        const nombre = `${it.id}__${c.id}`;
        if (c.tipo === "radio" || c.tipo === "escala") form.querySelectorAll(`[name="${nombre}"]`).forEach(el => { el.checked = el.value === v; });
        else if (c.tipo === "checks") form.querySelectorAll(`[name="${nombre}"]`).forEach(el => { el.checked = Array.isArray(v) && v.includes(el.value); });
        else { const el = form.querySelector(`[name="${nombre}"]`); if (el) el.value = v; }
      });
      if (r.nose) { const cb = form.querySelector(`[data-nose="${it.id}"]`); if (cb) { cb.checked = true; $("#p-" + it.id).classList.add("es-nose"); } }
    }));

    form.addEventListener("input", alCambiar);
    form.addEventListener("change", alCambiar);
  }

  function leerItem(it) {
    const form = $("#prueba");
    const campos = {};
    it.campos.forEach(c => {
      const nombre = `${it.id}__${c.id}`;
      if (c.tipo === "radio" || c.tipo === "escala") { const el = form.querySelector(`[name="${nombre}"]:checked`); campos[c.id] = el ? el.value : ""; }
      else if (c.tipo === "checks") campos[c.id] = [...form.querySelectorAll(`[name="${nombre}"]:checked`)].map(el => el.value);
      else { const el = form.querySelector(`[name="${nombre}"]`); campos[c.id] = el ? el.value.trim() : ""; }
    });
    const cb = form.querySelector(`[data-nose="${it.id}"]`);
    return { campos, nose: !!(cb && cb.checked) };
  }

  function alCambiar(ev) {
    const p = ev.target.closest(".pregunta"); if (!p) return;
    const id = p.dataset.item;
    const it = SECCIONES.flatMap(s => s.items).find(x => x.id === id);
    const r = leerItem(it);
    p.classList.toggle("es-nose", r.nose);
    estado.respuestas[id] = r; guardar(); actualizarProgreso();
  }

  function tieneRespuesta(r) {
    if (!r) return false;
    if (r.nose) return true;
    return Object.entries(r.campos || {}).some(([k, v]) => k !== "como" && k !== "otra" && (Array.isArray(v) ? v.length : String(v).trim() !== ""));
  }

  function actualizarProgreso() {
    const items = SECCIONES.flatMap(s => s.items);
    const hechos = items.filter(it => tieneRespuesta(estado.respuestas[it.id])).length;
    $("#progreso > div").style.width = (100 * hechos / items.length) + "%";
    const sin = items.filter(it => !tieneRespuesta(estado.respuestas[it.id])).map(it => it.id);
    $("#resumen-envio").innerHTML = sin.length
      ? `Respondiste o marcaste «No sé» en <strong>${hechos} de ${items.length}</strong> preguntas. Sin responder: ${sin.join(", ")}. Puedes enviar así: dejar preguntas en blanco está bien.`
      : `Respondiste todas las preguntas (${items.length}). Cuando quieras, envía tus respuestas.`;
  }

  // ── Reloj (orientativo: no cierra la prueba)
  let avisos = {};
  function iniciarReloj() {
    const dur = (CFG.DURACION_MIN || 45) * 60000, ini = new Date(estado.inicio).getTime(), reloj = $("#reloj");
    const tic = () => {
      const pasado = Date.now() - ini, resta = dur - pasado;
      if (resta <= 0) { reloj.textContent = "Tiempo cumplido"; reloj.classList.add("fin"); if (!avisos.fin) { avisos.fin = 1; toast("Se cumplieron los 45 minutos. Termina tu idea y envía tus respuestas."); } return; }
      const m = Math.floor(resta / 60000), s = Math.floor((resta % 60000) / 1000);
      reloj.textContent = `Quedan ${m}:${String(s).padStart(2, "0")}`;
      if (pasado > 30 * 60000 && !avisos.t30) { avisos.t30 = 1; toast("Llevas 30 minutos. Quedan unos 15."); }
      if (pasado > 40 * 60000 && !avisos.t40) { avisos.t40 = 1; toast("Quedan unos 5 minutos. Recuerda enviar al final."); }
    };
    tic(); setInterval(tic, 1000);
  }

  // ── Envío
  $("#btn-enviar").addEventListener("click", async () => {
    const msg = $("#msg-envio"), btn = $("#btn-enviar");
    msg.innerHTML = "";
    if (!CFG.API_URL) {
      msg.innerHTML = `<p class="error">La prueba todavía no está conectada a la hoja de resultados. Avísale a la docente. Tus respuestas siguen guardadas en este dispositivo.</p>`;
      return;
    }
    SECCIONES.forEach(s => s.items.forEach(it => { estado.respuestas[it.id] = leerItem(it); }));
    estado.fin = new Date().toISOString(); guardar();
    btn.disabled = true; btn.textContent = "Enviando…";
    try {
      const res = await fetch(CFG.API_URL, {
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ accion: "registrar", id: estado.id, nombre: estado.nombre, inicio: estado.inicio, fin: estado.fin, respuestas: estado.respuestas, version: 1 }),
      });
      const datos = await res.json();
      if (!datos.ok) throw new Error(datos.error || "No se pudo guardar");
      estado.enviado = true; guardar(); mostrarGracias();
    } catch (e) {
      msg.innerHTML = `<p class="error">No se pudieron enviar las respuestas (${esc(e.message)}). Revisa la conexión a internet e inténtalo otra vez. Tus respuestas siguen guardadas en este dispositivo.</p>`;
      btn.disabled = false; btn.textContent = "Intentar de nuevo";
    }
  });

  function mostrarGracias() {
    ["#inicio", "#prueba", "#envio", "#reloj", "#progreso"].forEach(s => $(s).classList.add("oculto"));
    $("#gracias").classList.remove("oculto");
    $("#txt-codigo").innerHTML = `Código de envío: ${esc(estado.id.slice(0, 8))}. Si usas un dispositivo compartido, <a href="#" id="lnk-nueva">deja listo el dispositivo para otra persona</a>.`;
    $("#lnk-nueva").addEventListener("click", ev => {
      ev.preventDefault();
      try { localStorage.removeItem(CLAVE_LOCAL); } catch (e) { /* nada */ }
      location.reload();
    });
    window.scrollTo(0, 0);
  }
})();
