// Genera respuestas inventadas para ver el panel antes de aplicar la prueba.
window.generarDemo = function (n = 18) {
  let semilla = 7;
  const rnd = () => { semilla = (semilla * 9301 + 49297) % 233280; return semilla / 233280; };
  const elegir = (pares) => { let r = rnd(), acc = 0; for (const [v, p] of pares) { acc += p; if (r < acc) return v; } return pares[pares.length - 1][0]; };
  const r = (campos, pNose = 0.06) => rnd() < pNose ? { campos: {}, nose: true } : { campos, nose: false };
  const textos = {
    C1: ["Cuántas personas fueron a la charla cada mes", "La asistencia a las charlas de seguridad", "Barras de los meses", ""],
    C5: ["Julio fue el mes con más asistentes y agosto el de menos", "En agosto la gente perdió el interés", "La asistencia sube y baja", ""],
    D1: ["Bodega tiene 10 reportes y Pintura 4 en septiembre", "Que Bodega es más peligrosa", "Bodega 10, Pintura 4; en Bodega trabajan 10 y en Pintura 5", ""],
    D2: ["Porque son reportes, no accidentes, y es solo un mes", "Porque tiene más reportes", "En Bodega trabajan más personas", "No sé si los reportes son graves"],
    D3: ["Cuántas personas trabajan", "Si hubo accidentes", "Datos de otros meses", "Qué tan graves fueron", "Qué hacen en cada área"],
    D4: ["Bodega tuvo más reportes que Pintura en septiembre, pero falta información", "Bodega es peligrosa", "Hay que revisar Bodega", ""],
    E3: ["Las fórmulas", "Los porcentajes", "Usar Excel", "Me pongo nervioso con los números", ""],
    E4: ["Hacer gráficos de accidentes", "Usar Excel para los reportes", "Entender los indicadores de la empresa", "Presentar informes al jefe"],
  };
  const t = k => textos[k][Math.floor(rnd() * textos[k].length)];
  const regs = [];
  for (let i = 0; i < n; i++) {
    const inicio = new Date(Date.now() - 86400000 + i * 60000);
    const fin = new Date(inicio.getTime() + (30 + rnd() * 15) * 60000);
    const respuestas = {
      A1: r({ v: elegir([["6", .85], ["4", .1], ["5", .05]]) }),
      A2: r({ v: elegir([["Soldadura", .75], ["Bodega", .2], ["Corte", .05]]) }),
      A3: r({ v: elegir([["30", .6], ["50", .15], ["80", .1], ["29", .15]]), como: "Sumé los totales" }, .1),
      A4: r({ area: elegir([["Bodega", .7], ["Corte", .3]]), dif: elegir([["1", .65], ["10", .25], ["2", .1]]) }),
      A5: r({ tipo: elegir([["Objetos en el paso", .6], ["Pisos húmedos o resbalosos", .3], ["Iluminación deficiente", .1]]), veces: elegir([["14", .55], ["6", .3], ["10", .15]]) }, .12),
      B1: r({ h: elegir([["4", .7], ["3", .3]]), m: elegir([["15", .7], ["75", .3]]), ap: "p. m." }),
      B2: r({ v: elegir([["22", .7], ["72", .2], ["26", .1]]) }),
      B3: r({ v: elegir([["75", .5], ["15", .2], ["5", .1], ["133", .05]]) }, .2),
      B4: r({ v: elegir([["75", .45], ["0,75", .2], ["43,8", .2], ["80", .15]]) }, .15),
      B5: r({ v: elegir([["6", .9], ["54", .1]]) }),
      B6: r({ v: elegir([["Bodega", .55], ["Corte", .2], ["Es igual en las dos", .25]]), como: "Comparé con las personas" }, .25),
      C1: r({ v: t("C1") }), C2: r({ vert: elegir([["Número de asistentes", .7], ["Los meses", .1], ["Números", .2]]), hor: elegir([["Los meses", .85], ["Asistentes", .15]]) }),
      C3: r({ v: elegir([["40", .85], ["35", .15]]) }), C4: r({ mes: elegir([["Agosto", .9], ["Junio", .1]]), dif: elegir([["15", .65], ["25", .35]]) }),
      C5: r({ v: t("C5") }),
      D1: r({ v: t("D1") }), D2: r({ op: elegir([["No", .4], ["Sí", .35], ["No estoy seguro(a)", .25]]), porque: t("D2") }),
      D3: r({ i1: t("D3"), i2: t("D3") }, .15), D4: r({ v: t("D4") }, .15),
      E1: { campos: { frec: elegir([["Nunca", .3], ["Algunas veces", .5], ["Con frecuencia", .2]]), usos: ["Escribir datos en celdas", "Sumar con una fórmula", "Hacer un gráfico", "Ordenar o filtrar datos"].filter(() => rnd() < .45), otra: "" } },
      E2: { campos: { v: elegir([["1", .1], ["2", .2], ["3", .35], ["4", .25], ["5", .1]]) } },
      E3: { campos: { v: t("E3") } }, E4: { campos: { v: t("E4") } },
    };
    const calificaciones = {};
    if (i < 10) ["C5", "D1", "D2", "D3", "D4"].forEach(k => { calificaciones[k] = elegir([["e", .4], ["c", .4], ["n", .2]]); });
    regs.push({ fecha: fin.toISOString(), id: "demo-" + i, nombre: i % 3 ? "Estudiante " + (i + 1) : "", inicio: inicio.toISOString(), fin: fin.toISOString(), respuestas, calificaciones });
  }
  return regs;
};
