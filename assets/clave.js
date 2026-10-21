// Clave de corrección y reglas de lectura del diagnóstico. Solo la usa el panel docente.
(function () {
  const num = v => {
    if (v == null || String(v).trim() === "") return null;
    const n = parseFloat(String(v).replace(/\s|%|cm|m/gi, "").replace(",", "."));
    return isNaN(n) ? null : n;
  };
  const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const igual = (a, b) => a != null && Math.abs(a - b) < 1e-9;

  // Cada pregunta autocorregible: evaluar(campos) → 1, 0.5 o 0; resumen(campos) → texto corto de la respuesta;
  // error(campos) → explicación de un error frecuente conocido (o null).
  const AUTO = {
    A1: { esperado: "6", evaluar: c => igual(num(c.v), 6) ? 1 : 0, resumen: c => c.v,
      error: c => [4, 5, 3, 1].includes(num(c.v)) ? "Leyó otra celda de la fila o la columna" : null },
    A2: { esperado: "Soldadura", evaluar: c => c.v === "Soldadura" ? 1 : 0, resumen: c => c.v,
      error: c => c.v === "Bodega" ? "Eligió el área con más reportes totales" : null },
    A3: { esperado: "30", evaluar: c => igual(num(c.v), 30) ? 1 : 0, resumen: c => c.v,
      error: c => ({ 50: "Sumó la columna de personas", 80: "Sumó personas y reportes", 10: "Sumó solo una columna", 14: "Sumó solo una columna", 6: "Sumó solo una columna" })[num(c.v)] || null },
    A4: { esperado: "Bodega, 1 más", evaluar: c => (c.area === "Bodega" ? .5 : 0) + (igual(num(c.dif), 1) ? .5 : 0), resumen: c => `${c.area || "—"} · ${c.dif || "—"}`,
      error: c => c.area === "Corte" || igual(num(c.dif), 10) ? "Comparó el número de personas en lugar de los reportes" : null },
    A5: { esperado: "Objetos en el paso, 14", evaluar: c => (c.tipo === "Objetos en el paso" ? .5 : 0) + (igual(num(c.veces), 14) ? .5 : 0), resumen: c => `${c.tipo || "—"} · ${c.veces || "—"}`,
      error: c => igual(num(c.veces), 6) ? "Tomó la celda más alta en lugar del total por tipo" : null },
    B1: { esperado: "4:15 p. m.", evaluar: c => igual(num(c.h), 4) && igual(num(c.m), 15) ? (c.ap === "p. m." ? 1 : .5) : 0, resumen: c => `${c.h || "?"}:${c.m || "?"} ${c.ap || ""}`.trim(),
      error: c => igual(num(c.m), 75) ? "Trató los minutos como decimales" : null },
    B2: { esperado: "22", evaluar: c => igual(num(c.v), 22) ? 1 : 0, resumen: c => c.v,
      error: c => igual(num(c.v), 72) ? "Calculó el total pero no restó lo entregado" : (Math.abs(num(c.v)) === 26 ? "Hizo un solo paso (24 − 50)" : null) },
    B3: { esperado: "75 %", evaluar: c => igual(num(c.v), 75) || igual(num(c.v), 0.75) ? 1 : 0, resumen: c => c.v,
      error: c => ({ 15: "Escribió la cantidad, no el porcentaje", 5: "Usó la diferencia (20 − 15)", 25: "Calculó quienes no asistieron", 133: "Invirtió la división", 1.33: "Invirtió la división" })[num(c.v)] || null },
    B4: { esperado: "75 cm", evaluar: c => igual(num(c.v), 75) ? 1 : (igual(num(c.v), 0.75) ? .5 : 0), resumen: c => c.v,
      error: c => igual(num(c.v), 0.75) ? "Dio el resultado en metros" : (Math.abs(num(c.v)) === 43.8 ? "Restó sin convertir las unidades" : null) },
    B5: { esperado: "6", evaluar: c => igual(num(c.v), 6) ? 1 : (igual(num(c.v), -6) ? .5 : 0), resumen: c => c.v,
      error: c => igual(num(c.v), 54) ? "Sumó en lugar de restar" : null },
    B6: { esperado: "Bodega", evaluar: c => c.v === "Bodega" ? 1 : 0, resumen: c => c.v,
      error: c => c.v === "Corte" || c.v === "Es igual en las dos" ? "No relacionó los reportes con el número de personas" : null },
    C1: { esperado: "Asistentes a la charla por mes", aprox: true, evaluar: c => /asist|charla|persona|capacit/.test(norm(c.v)) ? 1 : 0, resumen: c => c.v, error: () => null },
    C2: { esperado: "Vertical: asistentes · Horizontal: meses", aprox: true,
      evaluar: c => (/asist|persona|numero|cantidad|gente/.test(norm(c.vert)) ? .5 : 0) + (/mes/.test(norm(c.hor)) ? .5 : 0),
      resumen: c => `${c.vert || "—"} / ${c.hor || "—"}`, error: c => /mes/.test(norm(c.vert)) ? "Confundió los ejes" : null },
    C3: { esperado: "40", evaluar: c => igual(num(c.v), 40) ? 1 : 0, resumen: c => c.v,
      error: c => [35, 45].includes(num(c.v)) ? "Leyó la línea vecina" : null },
    C4: { esperado: "Agosto, 15 menos", evaluar: c => (c.mes === "Agosto" ? .5 : 0) + (igual(num(c.dif), 15) ? .5 : 0), resumen: c => `${c.mes || "—"} · ${c.dif || "—"}`,
      error: c => igual(num(c.dif), 25) ? "Dio el valor de agosto, no la diferencia" : null },
  };

  // Preguntas que la docente califica a mano desde el panel.
  const MANUAL = {
    C5: { guia: "Describe lo que muestra el gráfico (mayor, menor, cambios) sin inventar causas." },
    D1: { guia: "Describe solo lo que está en la tabla (10 y 4 reportes; personas por área), sin opinar." },
    D2: { guia: "Evalúa la frase con razones: reportes ≠ accidentes, un solo mes, distinto número de personas, cultura de reporte." },
    D3: { guia: "Pide información pertinente: personas u horas trabajadas, meses anteriores, gravedad, accidentes, tareas." },
    D4: { guia: "Propone una frase prudente que no afirme más de lo que muestran los datos." },
  };

  const HABILIDADES = [
    { id: "tablas", nombre: "Lectura de tablas", items: ["A1", "A2", "A3", "A4", "A5"],
      apoyo: "Practicar con tablas pequeñas, señalando fila y columna en voz alta antes de calcular (Unidad 1)." },
    { id: "operaciones", nombre: "Operaciones y unidades", items: ["B1", "B2", "B4", "B5"],
      apoyo: "Calentamientos de 5 minutos con cálculos cotidianos de SST: tiempos, cantidades y conversiones." },
    { id: "proporciones", nombre: "Proporciones y porcentajes", items: ["B3", "B6"],
      apoyo: "Repaso guiado con ejemplos concretos («3 de cada 4») antes de llegar a las tasas (Unidad 3)." },
    { id: "graficos", nombre: "Lectura de gráficos", items: ["C1", "C2", "C3", "C4", "C5"],
      apoyo: "Rutina de lectura: título → ejes → valores → diferencia → frase (Unidad 2)." },
    { id: "interpretacion", nombre: "Interpretación con cautela", items: ["D1", "D2", "D3", "D4"],
      apoyo: "Rutina «¿qué se ve? / ¿qué no sabemos? / ¿qué necesitaríamos?» en cada actividad." },
  ];

  const NIVELES = {
    ev: { nombre: "Se evidencia", clase: "ev" },
    ca: { nombre: "En camino", clase: "ca" },
    ac: { nombre: "Necesita acompañamiento", clase: "ac" },
    pe: { nombre: "Pendiente de revisar", clase: "pe" },
  };
  const nivelDe = p => p == null ? "pe" : p >= 0.7 ? "ev" : p >= 0.4 ? "ca" : "ac";
  const VALOR_MANUAL = { e: 1, c: 0.5, n: 0 };

  function vacia(r) {
    if (!r) return true;
    return !Object.entries(r.campos || {}).some(([k, v]) => k !== "como" && k !== "otra" && (Array.isArray(v) ? v.length : String(v).trim() !== ""));
  }

  // Estado de una pregunta en un registro: {estado: 'correcta'|'parcial'|'incorrecta'|'nose'|'blanco'|'pendiente', puntaje}
  function evaluarItem(registro, id) {
    const r = (registro.respuestas || {})[id];
    if (r && r.nose) return { estado: "nose", puntaje: 0 };
    if (vacia(r)) return { estado: "blanco", puntaje: 0 };
    if (AUTO[id]) {
      const p = AUTO[id].evaluar(r.campos || {});
      return { estado: p === 1 ? "correcta" : p > 0 ? "parcial" : "incorrecta", puntaje: p };
    }
    if (MANUAL[id]) {
      const cal = (registro.calificaciones || {})[id];
      if (cal == null) return { estado: "pendiente", puntaje: null };
      const p = VALOR_MANUAL[cal];
      return { estado: p === 1 ? "correcta" : p > 0 ? "parcial" : "incorrecta", puntaje: p };
    }
    return { estado: "respondida", puntaje: null };
  }

  function nivelHabilidad(registro, hab) {
    const ps = hab.items.map(id => evaluarItem(registro, id).puntaje).filter(p => p != null);
    if (!ps.length) return "pe";
    // Si faltan calificaciones manuales, el nivel queda pendiente.
    if (hab.items.some(id => evaluarItem(registro, id).estado === "pendiente")) return "pe";
    return nivelDe(ps.reduce((a, b) => a + b, 0) / ps.length);
  }

  window.CLAVE = { AUTO, MANUAL, HABILIDADES, NIVELES, evaluarItem, nivelHabilidad, num, norm };
})();
