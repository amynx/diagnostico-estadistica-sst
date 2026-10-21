// Contenido de la prueba diagnóstica (datos ficticios). Lo usan la prueba y el panel docente.
(function () {
  const AREAS = ["Corte", "Soldadura", "Bodega", "Pintura"];
  const TIPOS = ["Pisos húmedos o resbalosos", "Objetos en el paso", "Iluminación deficiente"];
  const MESES = ["Junio", "Julio", "Agosto", "Septiembre"];

  const TABLA = [
    ["Corte", 20, 3, 5, 1],
    ["Soldadura", 15, 1, 2, 4],
    ["Bodega", 10, 4, 6, 0],
    ["Pintura", 5, 2, 1, 1],
  ];
  const GRAFICO = [["Junio", 30], ["Julio", 40], ["Agosto", 25], ["Septiembre", 35]];

  function tablaHTML() {
    const filas = TABLA.map(([a, p, h, o, i]) =>
      `<tr><th scope="row">${a}</th><td>${p}</td><td>${h}</td><td>${o}</td><td>${i}</td><td>${h + o + i}</td></tr>`).join("");
    return `<div class="tabla-scroll"><table class="datos">
      <caption>Tabla 1. Reportes de condiciones inseguras por área, septiembre (datos ficticios)</caption>
      <thead><tr><th scope="col">Área</th><th scope="col">Personas que trabajan en el área</th><th scope="col">Pisos húmedos o resbalosos</th>
      <th scope="col">Objetos en el paso</th><th scope="col">Iluminación deficiente</th><th scope="col">Total de reportes del área</th></tr></thead>
      <tbody>${filas}</tbody></table></div>`;
  }

  function graficoSVG() {
    const W = 420, H = 330, x0 = 58, y0 = 268, alto = 236, ancho = 352, max = 45;
    let g = "";
    for (let v = 0; v <= max; v += 5) {
      const y = y0 - (v / max) * alto;
      g += `<line x1="${x0}" x2="${x0 + ancho}" y1="${y}" y2="${y}" class="g-rejilla"/>`;
      g += `<text x="${x0 - 10}" y="${y + 5}" text-anchor="end" class="g-num">${v}</text>`;
    }
    const paso = ancho / GRAFICO.length;
    GRAFICO.forEach(([mes, v], k) => {
      const h = (v / max) * alto, x = x0 + k * paso + paso * 0.2;
      g += `<rect x="${x}" y="${y0 - h}" width="${paso * 0.6}" height="${h}" class="g-barra"/>`;
      g += `<text x="${x + paso * 0.3}" y="${y0 + 24}" text-anchor="middle" class="g-num">${mes}</text>`;
    });
    g += `<line x1="${x0}" x2="${x0 + ancho}" y1="${y0}" y2="${y0}" class="g-eje"/><line x1="${x0}" x2="${x0}" y1="${y0}" y2="${y0 - alto}" class="g-eje"/>`;
    g += `<text x="${x0 + ancho / 2}" y="${y0 + 50}" text-anchor="middle" class="g-titulo-eje">Mes</text>`;
    g += `<text transform="translate(16 ${y0 - alto / 2}) rotate(-90)" text-anchor="middle" class="g-titulo-eje">Número de asistentes</text>`;
    return `<figure class="grafico"><figcaption>Asistentes a la charla mensual de seguridad (datos ficticios)</figcaption>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de barras: asistentes a la charla mensual de seguridad de junio a septiembre">${g}</svg></figure>`;
  }

  const como = { id: "como", tipo: "texto_largo", etiqueta: "¿Cómo lo pensaste? (opcional)", opcional: true };

  window.SECCIONES = [
    {
      id: "A", titulo: "Leer una tabla", minutos: 10,
      intro: `<p><strong>El caso.</strong> En el Taller Metalmecánico Los Robles (empresa ficticia), las personas reportan las condiciones inseguras que encuentran. La tabla muestra los reportes de septiembre.</p>${tablaHTML()}`,
      items: [
        { id: "A1", enunciado: "¿Cuántos reportes de «objetos en el paso» hubo en Bodega?", campos: [{ id: "v", tipo: "numero", sufijo: "reportes" }] },
        { id: "A2", enunciado: "¿Qué área tuvo más reportes de «iluminación deficiente»?", campos: [{ id: "v", tipo: "opciones", opciones: AREAS }] },
        { id: "A3", enunciado: "¿Cuántos reportes hubo en total en todo el taller durante septiembre?", campos: [{ id: "v", tipo: "numero", sufijo: "reportes" }, como] },
        { id: "A4", enunciado: "Compara Corte y Bodega. ¿Cuál tuvo más reportes en total y por cuántos reportes de diferencia?",
          campos: [{ id: "area", tipo: "opciones", etiqueta: "Área con más reportes", opciones: ["Corte", "Bodega"] }, { id: "dif", tipo: "numero", etiqueta: "Diferencia", sufijo: "reportes" }] },
        { id: "A5", enunciado: "Sumando todas las áreas, ¿qué tipo de condición se reportó más veces en el taller? ¿Cuántas veces?",
          campos: [{ id: "tipo", tipo: "opciones", etiqueta: "Tipo de condición", opciones: TIPOS }, { id: "veces", tipo: "numero", etiqueta: "Número de veces", sufijo: "veces" }] },
      ],
    },
    {
      id: "B", titulo: "Cálculos de todos los días", minutos: 12,
      intro: `<p class="nota">Puedes hacer las cuentas en una hoja aparte o en tu cabeza. Si llegas al resultado de otra forma, también vale.</p>`,
      items: [
        { id: "B1", enunciado: "Una capacitación dura 1 hora y 45 minutos. Si empieza a las 2:30 p. m., ¿a qué hora termina?",
          campos: [{ id: "h", tipo: "numero", etiqueta: "Hora", corto: true }, { id: "m", tipo: "numero", etiqueta: "Minutos", corto: true }, { id: "ap", tipo: "opciones", etiqueta: "a. m. / p. m.", opciones: ["a. m.", "p. m."], corto: true }] },
        { id: "B2", enunciado: "El taller compró 3 cajas de guantes. Cada caja trae 24 pares. Ya se entregaron 50 pares. ¿Cuántos pares quedan?", campos: [{ id: "v", tipo: "numero", sufijo: "pares" }, como] },
        { id: "B3", enunciado: "En el área de Corte trabajan 20 personas y 15 asistieron a una charla de seguridad. ¿Qué porcentaje de las personas de Corte asistió?", campos: [{ id: "v", tipo: "numero", sufijo: "%" }, como] },
        { id: "B4", enunciado: "Un pasillo mide 1,2 metros de ancho. Una caja ocupa 45 centímetros de ese ancho. ¿Cuántos centímetros quedan libres para pasar?", campos: [{ id: "v", tipo: "numero", sufijo: "cm" }, como] },
        { id: "B5", enunciado: "En agosto hubo 24 reportes de condiciones inseguras y en septiembre hubo 30. ¿Cuántos reportes más hubo en septiembre?", campos: [{ id: "v", tipo: "numero", sufijo: "reportes" }] },
        { id: "B6", enunciado: "Bodega tuvo 10 reportes y allí trabajan 10 personas. Corte tuvo 9 reportes y allí trabajan 20 personas. Si comparas el número de reportes con el número de personas de cada área, ¿en cuál hay más reportes por persona?",
          ayuda: "Si no te alcanza el tiempo, puedes dejarla.",
          campos: [{ id: "v", tipo: "opciones", opciones: ["Bodega", "Corte", "Es igual en las dos"] }, { id: "como", tipo: "texto_largo", etiqueta: "Explica cómo lo pensaste" }] },
      ],
    },
    {
      id: "C", titulo: "Leer un gráfico", minutos: 8,
      intro: `<p>El taller hace una charla de seguridad cada mes. El gráfico muestra cuántas personas asistieron de junio a septiembre.</p>${graficoSVG()}`,
      items: [
        { id: "C1", enunciado: "¿Qué información muestra el gráfico? Escríbelo con tus palabras.", campos: [{ id: "v", tipo: "texto_largo" }] },
        { id: "C2", enunciado: "¿Qué se representa en el eje vertical (el de los números) y qué en el eje horizontal (el de abajo)?",
          campos: [{ id: "vert", tipo: "texto", etiqueta: "Eje vertical" }, { id: "hor", tipo: "texto", etiqueta: "Eje horizontal" }] },
        { id: "C3", enunciado: "¿Cuántas personas asistieron en julio?", campos: [{ id: "v", tipo: "numero", sufijo: "personas" }] },
        { id: "C4", enunciado: "¿En qué mes asistieron menos personas? ¿Cuántas menos que en julio?",
          campos: [{ id: "mes", tipo: "opciones", etiqueta: "Mes", opciones: MESES }, { id: "dif", tipo: "numero", etiqueta: "Cuántas menos que en julio", sufijo: "personas" }] },
        { id: "C5", enunciado: "Escribe una frase que describa lo que ves en el gráfico.", campos: [{ id: "v", tipo: "texto_largo" }] },
      ],
    },
    {
      id: "D", titulo: "¿Qué podemos concluir?", minutos: 10,
      intro: `<p>Vuelve a mirar la Tabla 1 (sección A). En una reunión, un supervisor dice:</p>
        <blockquote>«Bodega tuvo 10 reportes y Pintura solo 4. Bodega es el área más peligrosa del taller».</blockquote>
        <details class="ver-tabla"><summary>Ver otra vez la Tabla 1</summary>${tablaHTML()}</details>`,
      items: [
        { id: "D1", enunciado: "¿Qué dicen exactamente los datos de la tabla sobre Bodega y Pintura? Escribe solo lo que se ve en la tabla.", campos: [{ id: "v", tipo: "texto_largo" }] },
        { id: "D2", enunciado: "¿Estás de acuerdo con la frase del supervisor?",
          campos: [{ id: "op", tipo: "radio", opciones: ["Sí", "No", "No estoy seguro(a)"] }, { id: "porque", tipo: "texto_largo", etiqueta: "¿Por qué?" }] },
        { id: "D3", enunciado: "Escribe dos informaciones que te gustaría tener antes de decir cuál área es más peligrosa.",
          campos: [{ id: "i1", tipo: "texto", etiqueta: "Información 1" }, { id: "i2", tipo: "texto", etiqueta: "Información 2" }] },
        { id: "D4", enunciado: "Si tuvieras que comunicar lo que muestra la tabla, ¿qué frase más prudente propondrías?", campos: [{ id: "v", tipo: "texto_largo" }] },
      ],
    },
    {
      id: "E", titulo: "Tu experiencia y tus expectativas", minutos: 5, sinNoSe: true,
      intro: `<p class="nota">Aquí no hay respuestas correctas ni incorrectas.</p>`,
      items: [
        { id: "E1", enunciado: "¿Has usado Excel u otra hoja de cálculo?",
          campos: [{ id: "frec", tipo: "radio", opciones: ["Nunca", "Algunas veces", "Con frecuencia"] },
            { id: "usos", tipo: "checks", etiqueta: "Si lo has usado, marca lo que has hecho:", opciones: ["Escribir datos en celdas", "Sumar con una fórmula", "Hacer un gráfico", "Ordenar o filtrar datos"] },
            { id: "otra", tipo: "texto", etiqueta: "Otra cosa (opcional)", opcional: true }] },
        { id: "E2", enunciado: "¿Qué tan cómodo(a) te sientes haciendo cálculos? (1 = nada cómodo, 5 = muy cómodo)", campos: [{ id: "v", tipo: "escala", opciones: ["1", "2", "3", "4", "5"] }] },
        { id: "E3", enunciado: "¿Qué parte de una materia con números o datos te genera más inquietud? (Opcional)", campos: [{ id: "v", tipo: "texto_largo", opcional: true }] },
        { id: "E4", enunciado: "¿Qué te gustaría aprender o poder hacer con datos en tu trabajo en SST?", campos: [{ id: "v", tipo: "texto_largo" }] },
      ],
    },
  ];
})();
