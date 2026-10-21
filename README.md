# Prueba diagnóstica · Estadística I (SST)

Versión web de la prueba diagnóstica de la Clase 1. Los estudiantes la responden desde el celular o el computador, y las respuestas se guardan en una hoja de Google Sheets de la docente. El panel docente calcula las métricas.

- **Prueba para estudiantes:** `index.html`
- **Panel docente:** `docente.html` (pide una clave)
- **Backend:** `apps-script/Codigo.gs` (Google Apps Script, gratis)

## Qué hace

**Prueba (estudiantes)**
- 5 secciones que suman 45 minutos, con datos ficticios y un botón «No sé» en cada pregunta.
- Reloj de 45 minutos con avisos a los 30 y 40 minutos (no cierra la prueba).
- Guarda el avance en el dispositivo: si se recarga la página, no se pierde nada.
- Funciona en celular. El nombre es opcional.

**Panel docente**
- Indicadores: respuestas recibidas, tiempo promedio, % respondido, % «No sé», % de aciertos y respuestas por revisar.
- Nivel del grupo por habilidad (tablas, operaciones, proporciones, gráficos, interpretación) y apoyos sugeridos.
- Resultados por pregunta, con las respuestas incorrectas más frecuentes y su posible explicación.
- Revisión de respuestas abiertas (C5 y D1–D4) con tres niveles: se evidencia, en camino y necesita acompañamiento.
- Uso de Excel, comodidad con los cálculos, inquietudes y expectativas.
- Vista privada por estudiante y descarga en CSV (se abre en Excel).
- Botón **«Ver con datos de ejemplo»** para conocer el panel antes de aplicar la prueba.

## Conectar la hoja de resultados (una sola vez, unos 10 minutos)

1. Entra a [Google Sheets](https://sheets.google.com) y crea una hoja nueva. Ponle un nombre, por ejemplo «Diagnóstico SST — respuestas».
2. En la hoja: **Extensiones → Apps Script**.
3. Borra el contenido de `Código.gs` y pega todo el contenido de [`apps-script/Codigo.gs`](apps-script/Codigo.gs). Guarda (ícono de disquete).
4. En Apps Script, abre **Configuración del proyecto** (ícono de engranaje) → **Propiedades del script** → **Agregar propiedad**:
   - Propiedad: `CLAVE_DOCENTE`
   - Valor: una clave que solo tú conozcas (es la que pedirá el panel docente).
5. Arriba a la derecha: **Implementar → Nueva implementación**.
   - Tipo: **Aplicación web**.
   - Ejecutar como: **Yo**.
   - Quién tiene acceso: **Cualquier usuario**. Esto es necesario para que los estudiantes puedan enviar sin iniciar sesión; los resultados solo se ven con tu clave.
   - Pulsa **Implementar** y autoriza con tu cuenta de Google. Si aparece «Google no verificó esta app», elige **Configuración avanzada → Ir a … (no seguro)**: es tu propio script.
6. Copia la **URL de la aplicación web** (termina en `/exec`).
7. En este repositorio, abre [`assets/config.js`](assets/config.js), pulsa el lápiz (editar), pega la URL entre las comillas de `API_URL` y guarda con **Commit changes**. En uno o dos minutos la página se actualiza.

Para comprobar que quedó bien, abre la URL `/exec` en el navegador: debe decir «Servicio de la prueba diagnóstica activo».

## Durante la clase

- Comparte el enlace de la prueba (por WhatsApp, la plataforma o un código QR en la diapositiva 9).
- Al terminar, abre `docente.html`, escribe tu clave y pulsa **Actualizar** para ver los envíos nuevos.
- Para dejar de recibir respuestas, agrega en las propiedades del script `PRUEBA_CERRADA` con el valor `si`.

## Privacidad

- Las respuestas quedan **solo en tu hoja de Google**; este repositorio no guarda datos de estudiantes.
- La prueba pide que no se escriban datos personales, de salud ni relatos de accidentes reales.
- La vista «Por estudiante» es de uso privado: sirve para planear apoyos, no para etiquetar.
- El repositorio es público y la clave de corrección (`assets/clave.js`) puede verse. Como la prueba no tiene nota, no es un problema; aun así, no compartas el enlace del repositorio con los estudiantes.

## Si cambias el script

Después de editar `Codigo.gs` en Apps Script: **Implementar → Administrar implementaciones → editar (lápiz) → Versión: nueva versión → Implementar**. Así la URL `/exec` sigue siendo la misma.
