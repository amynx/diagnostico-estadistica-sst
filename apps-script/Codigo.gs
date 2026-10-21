/**
 * Backend de la prueba diagnóstica (Google Apps Script + Google Sheets).
 * Guarda cada envío en la hoja "Respuestas" y entrega los resultados al panel docente.
 *
 * Propiedades del script (Configuración del proyecto → Propiedades del script):
 *   CLAVE_DOCENTE   (obligatoria) clave para abrir el panel docente.
 *   PRUEBA_CERRADA  (opcional) escribe "si" para dejar de recibir respuestas.
 */

const HOJA = 'Respuestas';
const ENCABEZADOS = ['fecha_registro', 'id', 'nombre', 'inicio', 'fin', 'respuestas_json', 'calificaciones_json'];
const MAX_BYTES = 60000;

function doGet() {
  return json_({ ok: true, mensaje: 'Servicio de la prueba diagnóstica activo.' });
}

function doPost(e) {
  try {
    const cuerpo = (e && e.postData && e.postData.contents) || '';
    if (cuerpo.length > MAX_BYTES) return json_({ ok: false, error: 'Envío demasiado grande' });
    const datos = JSON.parse(cuerpo);
    switch (datos.accion) {
      case 'registrar': return registrar_(datos);
      case 'resultados': return resultados_(datos);
      case 'calificar': return calificar_(datos);
      default: return json_({ ok: false, error: 'Acción desconocida' });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function registrar_(datos) {
  const props = PropertiesService.getScriptProperties();
  if (String(props.getProperty('PRUEBA_CERRADA') || '').toLowerCase() === 'si') {
    return json_({ ok: false, error: 'La prueba está cerrada' });
  }
  const id = texto_(datos.id, 80);
  if (!id) return json_({ ok: false, error: 'Falta el identificador' });

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const hoja = hoja_();
    if (filaDeId_(hoja, id) > 0) return json_({ ok: true, duplicado: true });
    hoja.appendRow([
      new Date(), id, texto_(datos.nombre, 60), texto_(datos.inicio, 40), texto_(datos.fin, 40),
      JSON.stringify(datos.respuestas || {}), '{}',
    ]);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}

function resultados_(datos) {
  if (!claveValida_(datos.clave)) return json_({ ok: false, error: 'Clave incorrecta' });
  const hoja = hoja_();
  const n = hoja.getLastRow() - 1;
  if (n < 1) return json_({ ok: true, registros: [] });
  const filas = hoja.getRange(2, 1, n, ENCABEZADOS.length).getValues();
  const registros = filas.map(f => ({
    fecha: f[0] instanceof Date ? f[0].toISOString() : String(f[0]),
    id: String(f[1]), nombre: String(f[2]), inicio: String(f[3]), fin: String(f[4]),
    respuestas: parse_(f[5]), calificaciones: parse_(f[6]),
  }));
  return json_({ ok: true, registros: registros });
}

function calificar_(datos) {
  if (!claveValida_(datos.clave)) return json_({ ok: false, error: 'Clave incorrecta' });
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const hoja = hoja_();
    const fila = filaDeId_(hoja, texto_(datos.id, 80));
    if (fila < 0) return json_({ ok: false, error: 'Respuesta no encontrada' });
    const celda = hoja.getRange(fila, 7);
    const actuales = parse_(celda.getValue());
    const nuevas = datos.calificaciones || {};
    Object.keys(nuevas).forEach(k => {
      if (/^[A-E]\d$/.test(k) && ['e', 'c', 'n', ''].indexOf(nuevas[k]) >= 0) {
        if (nuevas[k] === '') delete actuales[k]; else actuales[k] = nuevas[k];
      }
    });
    celda.setValue(JSON.stringify(actuales));
    return json_({ ok: true, calificaciones: actuales });
  } finally {
    lock.releaseLock();
  }
}

// ── Utilidades
function hoja_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(HOJA);
  if (!hoja) {
    hoja = libro.insertSheet(HOJA);
    hoja.appendRow(ENCABEZADOS);
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function filaDeId_(hoja, id) {
  const n = hoja.getLastRow() - 1;
  if (n < 1 || !id) return -1;
  const ids = hoja.getRange(2, 2, n, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) return i + 2;
  return -1;
}

function claveValida_(clave) {
  const real = PropertiesService.getScriptProperties().getProperty('CLAVE_DOCENTE');
  return !!real && String(clave || '') === real;
}

// Texto limpio; evita que la hoja lo interprete como fórmula.
function texto_(v, max) {
  let s = String(v == null ? '' : v).slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function parse_(v) {
  try { return JSON.parse(v || '{}'); } catch (e) { return {}; }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
