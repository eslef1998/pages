# ITAI Landing Page

Sitio estático para promocionar los servicios de ITAI (desarrollo web, e-commerce, automatización y software a la medida). Incluye animaciones con AOS, formulario de contacto conectado a EmailJS, toasts personalizados y modal de información con CTA hacia WhatsApp.

## Contenido
- `index.html`: estructura principal del sitio y componentes accesibles.
- `style.css`: estilos modulados con variables CSS, temática glassmorphism y optimización responsive.
- `main.js`: inicialización de AOS, envío del formulario usando EmailJS con fallback `fetch`, toasts reutilizables y lógica del modal.

## Requisitos
- Navegador moderno con soporte para ES6 y `fetch`.
- Cuenta de [EmailJS](https://www.emailjs.com/) con los identificadores definidos en `main.js`. Sustituye `EMAILJS_USER_ID`, `EMAILJS_SERVICE_ID` y `EMAILJS_TEMPLATE_ID` por tus valores antes de desplegar.

## Uso local
1. Clona o descarga este repositorio.
2. Abre `index.html` directamente en el navegador o sirve la carpeta con cualquier servidor estático (por ejemplo Live Server de VS Code).

```powershell
cd c:\Users\eslef\Desktop\pages-main
python -m http.server 8080
```

3. Visita `http://localhost:8080` para ver la landing con animaciones y modal.

## Personalización
- **Texto y servicios**: edita las secciones correspondientes en `index.html`.
- **Estilos**: ajusta los colores o espaciados modificando las variables en `style.css`.
- **Formulario**: actualiza los placeholders o campos desde `index.html` y revisa las validaciones en `main.js` (`isFormValid`).
- **Toasts**: llama a `window.showToast(type, titulo, mensaje)` para reutilizar las notificaciones.

## Despliegue
Es un sitio estático; puedes usar GitHub Pages, Netlify, Vercel o cualquier hosting que sirva archivos estáticos. Recuerda configurar tu dominio / SSL si corresponde y añadir los registros DNS necesarios.

## Notas
- El modal de chat se abre automáticamente al cargar la página. Ajusta el retraso o el comportamiento en `initChatModal()` si prefieres abrirlo bajo demanda.
- Valida que la cuenta de EmailJS tenga habilitado el origen del dominio donde publicarás la página.