
// main.js - Centraliza AOS, EmailJS, envío de formulario y toasts
(function () {
    'use strict';

    // === Configuración EmailJS ===
    const EMAILJS_USER_ID = 'cJVlkMVNEtusWv3XP';
    const EMAILJS_SERVICE_ID = 'service_1z95hfb';
    const EMAILJS_TEMPLATE_ID = 'template_ljpj5vl';

    // Inicializar AOS (animaciones de scroll)
    if (window.AOS) {
        AOS.init({ duration: 800, once: true });
    }

    // Inicializar EmailJS si el SDK está cargado
    if (typeof emailjs !== 'undefined' && emailjs.init) {
        try { emailjs.init(EMAILJS_USER_ID.trim()); console.log('EmailJS inicializado.'); }
        catch (e) { console.warn('EmailJS init falló:', e); }
    } else {
        console.warn('EmailJS SDK no cargado. Se usará fallback si es necesario.');
    }

    /**
     * Muestra un toast moderno y centralizado
     * @param {'success'|'error'} type
     * @param {string} title
     * @param {string} msg
     * @param {number} timeout
     */
    function showToast(type, title, msg, timeout = 4200) {
        try {
            const container = document.getElementById('toast-container');
            if (!container) { console.warn('toast container no encontrado'); return; }
            const toast = document.createElement('div');
            toast.className = 'toast ' + (type === 'success' ? 'success' : (type === 'error' ? 'error' : ''));
            const iconHTML = type === 'success'
                ? '<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                : '<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

            toast.innerHTML = '<div style="display:flex;align-items:flex-start;gap:10px;min-width:0;"><div>' + iconHTML + '</div><div style="display:flex;flex-direction:column;min-width:0;"><div class="title">' + (title || '') + '</div><div class="msg">' + (msg || '') + '</div><div class="progress"><i style="transform:scaleX(1);"></i></div></div></div><button class="close" aria-label="Cerrar">×</button>';
            container.appendChild(toast);
            // Forzar reflow para transición
            void toast.offsetWidth;
            toast.classList.add('show');
            const btn = toast.querySelector('.close');
            btn.addEventListener('click', function () { removeToast(toast); });
            const prog = toast.querySelector('.progress > i');
            if (prog) { prog.style.transition = 'transform ' + timeout + 'ms linear'; prog.style.transform = 'scaleX(0)'; }
            setTimeout(function () { removeToast(toast); }, timeout);
            function removeToast(node) { if (!node) return; node.classList.remove('show'); setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 260); }
        } catch (e) { console.error('showToast error:', e); }
    }

    // Exponer globalmente para uso externo
    try { window.showToast = showToast; } catch (e) { /* noop */ }

    // === Manejo de formulario de contacto ===
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const form = this;

            // Validación básica de campos (puedes expandir según necesidad)
            if (!form.from_name.value.trim() || !form.reply_to.value.trim() || !form.message.value.trim()) {
                showToast('error', 'Campos requeridos', 'Por favor completa todos los campos.');
                return;
            }

            if (typeof emailjs !== 'undefined' && typeof emailjs.sendForm === 'function') {
                emailjs.sendForm(EMAILJS_SERVICE_ID.trim(), EMAILJS_TEMPLATE_ID.trim(), form)
                    .then(function (response) {
                        showToast('success', '', '¡Mensaje enviado correctamente!');
                        form.reset();
                    })
                    .catch(function (error) {
                        console.error('Error sendForm:', error);
                        showToast('error', 'Error', 'No se pudo enviar. Ver consola para más detalles.');
                        fallbackFetch(form);
                    });
            } else {
                console.warn('emailjs.sendForm no disponible, usando fetch fallback');
                fallbackFetch(form);
            }
        });
    }

    // Fallback para envío si EmailJS falla
    function fallbackFetch(form) {
        const payload = {
            service_id: EMAILJS_SERVICE_ID.trim(),
            template_id: EMAILJS_TEMPLATE_ID.trim(),
            user_id: EMAILJS_USER_ID.trim(),
            template_params: {
                from_name: form.from_name ? form.from_name.value : '',
                reply_to: form.reply_to ? form.reply_to.value : '',
                message: form.message ? form.message.value : ''
            }
        };

        fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (res) {
                return res.text().then(function (text) {
                    console.log('Fallback response status:', res.status, 'body:', text);
                    if (res.ok) {
                        showToast('success', '', '¡Mensaje enviado correctamente!');
                        if (contactForm) contactForm.reset();
                    } else {
                        showToast('error', 'Error', 'Error al enviar (fallback). Revisa la consola.');
                    }
                });
            })
            .catch(function (err) {
                console.error('Fetch fallback error:', err);
                showToast('error', 'Error', 'Error al enviar. Revisa la consola.');
            });
    }

    // === Efecto typewriter en el hero ===
    (function () {
        const text = 'Impulsa tu negocio con tecnología profesional';
        const typewriter = document.getElementById('typewriter');
        if (!typewriter) return;
        let i = 0;
        function type() {
            if (i < text.length) {
                typewriter.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, 40);
            }
        }
        typewriter.innerHTML = '';
        setTimeout(type, 8);
    })();

})();
