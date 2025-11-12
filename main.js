
// main.js - Inicializa animaciones, EmailJS, formulario y componentes interactivos
(function () {
    'use strict';

    const EMAILJS_USER_ID = 'cJVlkMVNEtusWv3XP';
    const EMAILJS_SERVICE_ID = 'service_1z95hfb';
    const EMAILJS_TEMPLATE_ID = 'template_ljpj5vl';
    const TYPING_DELAY = 40;
    const CHAT_API_URL = window.CHAT_API_URL || 'http://localhost:4000/api/chat';
    const ICONS = {
        success: '<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        error: '<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };

    function init() {
        initAOS();
        initEmailJS();
        initContactForm();
        initTypewriter();
        initChatModal();
        initChatBot();
        updateCurrentYear();
        exposeToast();
    }

    function initAOS() {
        if (window.AOS) {
            AOS.init({ duration: 800, once: true });
        }
    }

    function initEmailJS() {
        if (typeof emailjs !== 'undefined' && typeof emailjs.init === 'function') {
            try {
                emailjs.init(EMAILJS_USER_ID.trim());
            } catch (error) {
                console.warn('EmailJS init falló:', error);
            }
        } else {
            console.warn('EmailJS SDK no cargado. Se usará fetch como respaldo.');
        }
    }

    function initContactForm() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', (event) => {
            event.preventDefault();

            if (!isFormValid(form)) {
                showToast('error', 'Campos requeridos', 'Por favor completa todos los campos.');
                return;
            }

            const submitButton = form.querySelector('button[type="submit"]');
            toggleSubmitting(submitButton, true);

            sendWithEmailJS(form)
                .catch((err) => {
                    console.warn('Fallo EmailJS, intentando fallback:', err);
                    return sendWithFetch(form);
                })
                .then(() => {
                    showToast('success', '¡Mensaje enviado!', 'Gracias por escribirnos.');
                    form.reset();
                })
                .catch((error) => {
                    console.error('No se pudo enviar el formulario:', error);
                    showToast('error', 'Error', 'No se pudo enviar tu mensaje. Inténtalo de nuevo más tarde.');
                })
                .finally(() => {
                    toggleSubmitting(submitButton, false);
                });
        });
    }

    function isFormValid(form) {
        const name = form.elements.from_name?.value.trim();
        const email = form.elements.reply_to?.value.trim();
        const message = form.elements.message?.value.trim();
        return Boolean(name && email && message);
    }

    function toggleSubmitting(button, isLoading) {
        if (!button) return;
        button.disabled = isLoading;
        button.dataset.originalText = button.dataset.originalText || button.textContent;
        button.textContent = isLoading ? 'Enviando…' : button.dataset.originalText;
    }

    function sendWithEmailJS(form) {
        if (typeof emailjs === 'undefined' || typeof emailjs.sendForm !== 'function') {
            return Promise.reject(new Error('EmailJS no disponible'));
        }
        return emailjs.sendForm(EMAILJS_SERVICE_ID.trim(), EMAILJS_TEMPLATE_ID.trim(), form);
    }

    function sendWithFetch(form) {
        const payload = {
            service_id: EMAILJS_SERVICE_ID.trim(),
            template_id: EMAILJS_TEMPLATE_ID.trim(),
            user_id: EMAILJS_USER_ID.trim(),
            template_params: {
                from_name: form.elements.from_name?.value || '',
                reply_to: form.elements.reply_to?.value || '',
                message: form.elements.message?.value || ''
            }
        };

        return fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(async (response) => {
            const bodyText = await response.text();
            if (!response.ok) {
                const error = new Error('EmailJS fallback error');
                error.status = response.status;
                error.body = bodyText;
                throw error;
            }
            return bodyText;
        });
    }

    function initTypewriter() {
        const typewriter = document.getElementById('typewriter');
        if (!typewriter) return;

        const text = typewriter.dataset.text || typewriter.textContent || '';
        if (!text) return;

        typewriter.textContent = '';
        let index = 0;

        (function type() {
            if (index < text.length) {
                typewriter.textContent += text.charAt(index);
                index += 1;
                setTimeout(type, TYPING_DELAY);
            }
        })();
    }

    function initChatModal() {
        const overlay = document.getElementById('chatOverlay');
        const modal = document.getElementById('chatModal');
        const closeButton = document.getElementById('chatClose');
        const trigger = document.getElementById('chatTrigger');
        if (!overlay || !modal || !closeButton || !trigger) return;

        const closeModal = () => {
            modal.classList.remove('show');
            overlay.setAttribute('aria-hidden', 'true');
            trigger.setAttribute('aria-expanded', 'false');
            setTimeout(() => {
                overlay.style.display = 'none';
                document.removeEventListener('keydown', handleKeydown);
            }, 280);
        };

        const handleKeydown = (event) => {
            if (event.key === 'Escape') {
                closeModal();
            }
        };

        const openModal = () => {
            overlay.style.display = 'flex';
            overlay.setAttribute('aria-hidden', 'false');
            requestAnimationFrame(() => modal.classList.add('show'));
            document.addEventListener('keydown', handleKeydown);
            trigger.setAttribute('aria-expanded', 'true');
        };

        closeButton.addEventListener('click', closeModal);
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                closeModal();
            }
        });

        // Mostrar ventana informativa después de una breve pausa
        setTimeout(openModal, 80);
    }

    function initChatBot() {
        const chatTrigger = document.getElementById('chatTrigger');
        if (!chatTrigger) return;

        // Crear y añadir el widget de chat al DOM
        createChatWidget();

        // Configurar el trigger para abrir/cerrar chat
        chatTrigger.addEventListener('click', toggleChatWidget);
    }

    function createChatWidget() {
        // Crear contenedor principal del chat
        const chatWidget = document.createElement('div');
        chatWidget.id = 'chatWidget';
        chatWidget.className = 'chat-widget-container';
        chatWidget.setAttribute('aria-hidden', 'true');
        
        chatWidget.innerHTML = `
            <div class="chat-widget-header">
                <div class="chat-widget-title">
                    <div class="chat-avatar">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C13.1046 2 14 2.89543 14 4V8C14 9.10457 13.1046 10 12 10C10.8954 10 10 9.10457 10 8V4C10 2.89543 10.8954 2 12 2Z" fill="currentColor"/>
                            <path d="M12 12C15.3137 12 18 14.6863 18 18V20C18 21.1046 17.1046 22 16 22H8C6.89543 22 6 21.1046 6 20V18C6 14.6863 8.68629 12 12 12Z" fill="currentColor"/>
                        </svg>
                    </div>
                    <div class="chat-info">
                        <h3>Asistente ITAI</h3>
                        <p class="chat-status">En línea</p>
                    </div>
                </div>
                <button class="chat-close-btn" id="chatCloseBtn" aria-label="Cerrar chat">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
            
            <div class="chat-widget-messages" id="chatMessages">
                <div class="chat-message chat-message-ai">
                    <div class="message-avatar">IA</div>
                    <div class="message-content">
                        <p>¡Hola! Soy tu asistente virtual de ITAI. ¿En qué puedo ayudarte hoy? 🚀</p>
                    </div>
                </div>
            </div>
            
            <div class="chat-widget-input">
                <div class="chat-typing-indicator" id="chatTyping" style="display: none;">
                    <span></span><span></span><span></span>
                    Escribiendo...
                </div>
                <form class="chat-input-form" id="chatInputForm">
                    <textarea 
                        id="chatTextarea" 
                        placeholder="Escribe tu mensaje..."
                        rows="1"
                        maxlength="1000"
                    ></textarea>
                    <button type="submit" class="chat-send-btn" id="chatSendBtn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </form>
            </div>
        `;

        document.body.appendChild(chatWidget);

        // Inicializar funcionalidad del chat
        initChatEvents();
    }

    function initChatEvents() {
        const closeBtn = document.getElementById('chatCloseBtn');
        const form = document.getElementById('chatInputForm');
        const textarea = document.getElementById('chatTextarea');
        const sendBtn = document.getElementById('chatSendBtn');

        if (closeBtn) {
            closeBtn.addEventListener('click', toggleChatWidget);
        }

        if (form) {
            form.addEventListener('submit', handleChatSubmit);
        }

        if (textarea) {
            // Auto-resize textarea
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 100) + 'px';
            });

            // Send on Enter (Shift+Enter for new line)
            textarea.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    form.dispatchEvent(new Event('submit'));
                }
            });
        }
    }

    function toggleChatWidget() {
        const chatWidget = document.getElementById('chatWidget');
        const chatTrigger = document.getElementById('chatTrigger');
        
        if (!chatWidget) return;

        const isVisible = chatWidget.classList.contains('show');
        
        if (isVisible) {
            chatWidget.classList.remove('show');
            chatWidget.setAttribute('aria-hidden', 'true');
            if (chatTrigger) chatTrigger.setAttribute('aria-expanded', 'false');
        } else {
            chatWidget.classList.add('show');
            chatWidget.setAttribute('aria-hidden', 'false');
            if (chatTrigger) chatTrigger.setAttribute('aria-expanded', 'true');
            
            // Focus en el textarea cuando se abre
            setTimeout(() => {
                const textarea = document.getElementById('chatTextarea');
                if (textarea) textarea.focus();
            }, 300);
        }
    }

    async function handleChatSubmit(e) {
        e.preventDefault();
        
        const textarea = document.getElementById('chatTextarea');
        const message = textarea.value.trim();
        
        if (!message) return;

        // Añadir mensaje del usuario
        appendChatMessage('user', message);
        textarea.value = '';
        textarea.style.height = 'auto';

        // Mostrar indicador de escritura
        showTypingIndicator(true);

        try {
            const response = await fetch(CHAT_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    context: {
                        origin: 'chat-widget',
                        timestamp: new Date().toISOString(),
                        userAgent: navigator.userAgent
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Simular delay de escritura más realista
            setTimeout(() => {
                showTypingIndicator(false);
                appendChatMessage('ai', data.reply || 'Gracias por escribirnos. Pronto te contactaremos.');
                
                // Mostrar status si se envió alerta
                if (data.sentAlert) {
                    updateChatStatus('Notificación enviada por WhatsApp ✓');
                }
            }, 800 + Math.random() * 1200);

        } catch (error) {
            console.error('Error en chat:', error);
            showTypingIndicator(false);
            
            setTimeout(() => {
                appendChatMessage('ai', 'Lo siento, no puedo responder en este momento. Por favor, intenta de nuevo o contacta directamente por WhatsApp.');
                showToast('error', 'Chat no disponible', 'Verifica tu conexión e intenta nuevamente.');
            }, 500);
        }
    }

    function appendChatMessage(type, content) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message chat-message-${type}`;
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${type === 'ai' ? 'IA' : 'TÚ'}</div>
            <div class="message-content">
                <p>${content}</p>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function showTypingIndicator(show) {
        const indicator = document.getElementById('chatTyping');
        if (!indicator) return;

        if (show) {
            indicator.style.display = 'flex';
        } else {
            indicator.style.display = 'none';
        }

        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    function updateChatStatus(message) {
        const statusElement = document.querySelector('.chat-status');
        if (!statusElement) return;

        const originalText = statusElement.textContent;
        statusElement.textContent = message;
        
        setTimeout(() => {
            statusElement.textContent = originalText;
        }, 3000);
    }

    function updateCurrentYear() {
        const target = document.getElementById('currentYear');
        if (target) {
            target.textContent = String(new Date().getFullYear());
        }
    }

    function showToast(type = 'success', title = '', message = '', timeout = 4200) {
        const container = document.getElementById('toast-container');
        if (!container) {
            console.warn('No se encontró el contenedor de toasts.');
            return;
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        if (type === 'success' || type === 'error') {
            toast.classList.add(type);
        }

        const content = document.createElement('div');
        content.className = 'toast-content';

        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'icon';
        iconWrapper.innerHTML = ICONS[type] || ICONS.error;

        const body = document.createElement('div');
        body.className = 'toast-body';

        const titleEl = document.createElement('div');
        titleEl.className = 'title';
        titleEl.textContent = title;

        const messageEl = document.createElement('div');
        messageEl.className = 'msg';
        messageEl.textContent = message;

        const progress = document.createElement('div');
        progress.className = 'progress';

        const progressBar = document.createElement('i');
        progress.append(progressBar);

        const closeButton = document.createElement('button');
        closeButton.className = 'close';
        closeButton.type = 'button';
        closeButton.setAttribute('aria-label', 'Cerrar notificación');
        closeButton.textContent = '×';

        body.append(titleEl, messageEl, progress);
        content.append(iconWrapper, body);
        toast.append(content, closeButton);
        container.append(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
            progressBar.style.transition = `transform ${timeout}ms linear`;
            progressBar.style.transform = 'scaleX(0)';
        });

        const remove = () => removeToast(toast);
        closeButton.addEventListener('click', remove, { once: true });
        setTimeout(remove, timeout);
    }

    function removeToast(toast) {
        if (!toast) return;
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 260);
    }

    function exposeToast() {
        try {
            window.showToast = showToast;
        } catch (error) {
            console.warn('No se pudo exponer showToast:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }

})();