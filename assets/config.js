// Configuración de la prueba diagnóstica.
// API_URL: pega aquí la URL de la aplicación web de Google Apps Script (termina en /exec).
// Mientras esté vacía, la prueba funciona pero no puede enviar respuestas.
window.DIAG_CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbz9SA31IsORPFbbYBsFUL4ttbfyRiz2ImWX7EmOhjAKoFJC5_L5aTxQkQS8LZ7vRgY_/exec",
  // Minutos que deben pasar desde que la persona empieza antes de poder enviar (no hay límite máximo).
  MINUTOS_MINIMOS: 60,
};
