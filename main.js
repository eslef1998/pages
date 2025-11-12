// main.js - Inicializa animaciones, EmailJS, formulario y componentes interactivos
(function () {
    'use strict';

    const EMAILJS_USER_ID = 'cJVlkMVNEtusWv3XP';
    const EMAILJS_SERVICE_ID = 'service_1z95hfb';
    const EMAILJS_TEMPLATE_ID = 'template_ljpj5vl';
    const TYPING_DELAY = 40;
    const CHAT_API_URL = window.CHAT_API_URL || 'http://localhost:4000/api/chat';
    const LEADS_API_URL = window.LEADS_API_URL || 'http://localhost:4000/api/leads';
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

            const submitBtn = form.querySelector('.btn-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Enviando...';
            submitBtn.disabled = true;

            const formData = new FormData(form);
            const templateParams = {
                user_name: formData.get('nombre'),
                user_email: formData.get('email'),
                user_phone: formData.get('telefono'),
                user_message: formData.get('mensaje'),
                to_name: 'ITAI Team'
            };

            if (typeof emailjs !== 'undefined' && typeof emailjs.send === 'function') {
                emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
                    .then(() => {
                        showToast('success', '¡Mensaje enviado!', 'Te contactaremos pronto');
                        form.reset();
                    })
                    .catch((error) => {
                        console.error('EmailJS error:', error);
                        showToast('error', 'Error', 'No se pudo enviar el mensaje');
                    })
                    .finally(() => {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                    });
            } else {
                setTimeout(() => {
                    showToast('success', '¡Mensaje enviado!', 'Te contactaremos pronto');
                    form.reset();
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 1000);
            }
        });
    }

    function initTypewriter() {
        const element = document.querySelector('.hero-title-typing');
        if (!element) return;

        const text = element.textContent;
        element.textContent = '';
        element.style.visibility = 'visible';

        let index = 0;
        const writeText = () => {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                setTimeout(writeText, TYPING_DELAY);
            }
        };

        setTimeout(writeText, 500);
    }

    function initChatModal() {
        const overlay = document.getElementById('chatOverlay') || document.getElementById('chatModal');
        const modal = overlay?.querySelector('.modal') || overlay?.querySelector('.chat-modal');
        const closeButton = overlay?.querySelector('.modal-close') || overlay?.querySelector('.chat-close');

        if (!overlay || !modal || !closeButton) return;

        const closeModal = () => {
            modal.classList.remove('show');
            overlay.setAttribute('aria-hidden', 'true');
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
        };

        closeButton.addEventListener('click', closeModal);
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                closeModal();
            }
        });

        // Botón adicional de cerrar en el contenido del modal
        const closeModalBtn = document.getElementById('closeModalBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeModal);
        }

        // Mostrar ventana informativa después de una breve pausa
        setTimeout(openModal, 80);
    }

    function initChatBot() {
        const chatTrigger = document.getElementById('chatTrigger');
        if (!chatTrigger) return;

        // Crear y añadir el widget de chat al DOM
        createChatWidget();
        
        // Crear mensaje animado del asistente
        createChatBubbleMessage();

        // Configurar el botón flotante para abrir chat directamente
        chatTrigger.addEventListener('click', (e) => {
            // Si el modal está abierto, cerrarlo primero
            const modal = document.getElementById('chatModal');
            const overlay = document.getElementById('chatOverlay');
            
            if (overlay && overlay.getAttribute('aria-hidden') === 'false') {
                // Cerrar modal
                modal.classList.remove('show');
                overlay.setAttribute('aria-hidden', 'true');
                chatTrigger.setAttribute('aria-expanded', 'false');
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 280);
                
                // Abrir chat después de cerrar modal
                setTimeout(() => {
                    toggleChatWidget();
                }, 300);
            } else {
                // Modal no está abierto, abrir chat directamente
                e.preventDefault();
                e.stopPropagation();
                toggleChatWidget();
            }
        });
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
                        <p class="chat-status">
                            <span class="status-indicator"></span>
                            En línea
                        </p>
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
                        <p><strong>¡Hola! Soy tu asistente virtual de ITAI 🚀</strong></p>
                        <p>Nuestras webs vienen con chat con IA que entiende tus productos y responde como tu equipo.</p>
                        <p><strong>✓</strong> Respuesta inmediata 24/7 con tono humano<br>
                        <strong>✓</strong> Entrenamiento con catálogos y FAQ<br>
                        <strong>✓</strong> Captura leads y envía alertas a WhatsApp</p>
                        <p>¿En qué puedo ayudarte hoy?</p>
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

    function createChatBubbleMessage() {
        const chatTrigger = document.getElementById('chatTrigger');
        if (!chatTrigger) return;

        // Mensajes rotativos para el asistente
        const messages = [
            '¡Hola! Soy tu asistente',
            '¿Necesitas ayuda?',
            'Estoy aquí para ti',
            '¿En qué te ayudo?',
            '¡Charlemos! 😊'
        ];
        let currentMessageIndex = 0;

        // Crear el globo de mensaje
        const messageBubble = document.createElement('div');
        messageBubble.className = 'chat-message-bubble';
        messageBubble.textContent = messages[0];
        
        // Añadir al botón trigger SIN cambiar su position
        chatTrigger.appendChild(messageBubble);

        // Función para mostrar el mensaje
        const showMessage = () => {
            if (chatTrigger.classList.contains('chat-open')) return;
            
            // Cambiar mensaje
            messageBubble.textContent = messages[currentMessageIndex];
            currentMessageIndex = (currentMessageIndex + 1) % messages.length;
            
            messageBubble.classList.add('show', 'typing');
            
            setTimeout(() => {
                messageBubble.classList.remove('show', 'typing');
            }, 3500);
        };

        // Mostrar mensaje inicial después de 3 segundos
        setTimeout(showMessage, 3000);
        
        // Repetir cada 12 segundos
        const messageInterval = setInterval(() => {
            if (!chatTrigger.classList.contains('chat-open')) {
                showMessage();
            }
        }, 12000);

        // Guardar referencia para poder limpiar después
        chatTrigger._messageInterval = messageInterval;
        chatTrigger._messageBubble = messageBubble;
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
            if (chatTrigger) {
                chatTrigger.setAttribute('aria-expanded', 'false');
                chatTrigger.classList.remove('chat-open');
                
                // Ocultar mensaje si está visible y reactivar animaciones
                if (chatTrigger._messageBubble) {
                    chatTrigger._messageBubble.classList.remove('show', 'typing');
                }
            }
        } else {
            chatWidget.classList.add('show');
            chatWidget.setAttribute('aria-hidden', 'false');
            if (chatTrigger) {
                chatTrigger.setAttribute('aria-expanded', 'true');
                chatTrigger.classList.add('chat-open');
                
                // Ocultar mensaje animado cuando el chat está abierto
                if (chatTrigger._messageBubble) {
                    chatTrigger._messageBubble.classList.remove('show', 'typing');
                }
            }

            // Focus en el textarea
            const textarea = document.getElementById('chatTextarea');
            if (textarea) {
                setTimeout(() => textarea.focus(), 300);
            }
        }
    }

    async function handleChatSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const textarea = form.querySelector('#chatTextarea');
        const message = textarea.value.trim();
        
        if (!message) return;

        // Limpiar el textarea
        textarea.value = '';
        textarea.style.height = 'auto';

        // Añadir mensaje del usuario
        addChatMessage(message, 'user');
        
        // Mostrar indicador de escritura
        showTypingIndicator(true);

        try {
            const response = await fetch(CHAT_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    context: {
                        timestamp: new Date().toISOString(),
                        source: 'chat_widget'
                    }
                }),
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Ocultar indicador de escritura
            showTypingIndicator(false);
            
            // Añadir respuesta de la IA
            addChatMessage(data.reply, 'ai');
            
            // Si hay necesidad de asesoría, mostrar botón
            if (data.reply.toLowerCase().includes('asesor') || data.reply.toLowerCase().includes('contactar')) {
                setTimeout(() => showLeadsForm(), 1000);
            }

        } catch (error) {
            console.error('Error en chat:', error);
            showTypingIndicator(false);
            addChatMessage('Disculpa, hubo un problema. Un especialista de ITAI te contactará pronto.', 'ai');
        }
    }

    function addChatMessage(message, type) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message chat-message-${type}`;
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${type === 'ai' ? 'IA' : 'TÚ'}</div>
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
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

    function showLeadsForm() {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const formHTML = `
            <div class="chat-message chat-message-ai">
                <div class="message-avatar">IA</div>
                <div class="message-content">
                    <p><strong>¡Perfecto! Vamos a conectarte con un especialista</strong></p>
                    <form id="leadsForm" class="leads-form">
                        <input type="text" name="name" placeholder="Tu nombre" required>
                        <input type="email" name="email" placeholder="Tu email" required>
                        <input type="tel" name="phone" placeholder="Tu teléfono (opcional)">
                        <input type="text" name="company" placeholder="Tu empresa (opcional)">
                        <select name="interest" required>
                            <option value="">¿Qué te interesa más?</option>
                            <option value="Web con chat IA">Página web con chat IA</option>
                            <option value="Chatbot WhatsApp">Chatbot para WhatsApp</option>
                            <option value="Automatización ventas">Automatización de ventas</option>
                            <option value="Asesoría completa">Asesoría completa</option>
                        </select>
                        <textarea name="message" placeholder="Cuéntanos sobre tu proyecto..." required></textarea>
                        <button type="submit" class="leads-submit-btn">Solicitar Asesoría 🚀</button>
                    </form>
                </div>
            </div>
        `;

        messagesContainer.insertAdjacentHTML('beforeend', formHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Añadir evento al formulario
        const leadsForm = document.getElementById('leadsForm');
        if (leadsForm) {
            leadsForm.addEventListener('submit', handleLeadsSubmit);
        }
    }

    function showServicesInfo() {
        const message = `
            <strong>🚀 Nuestros Servicios ITAI:</strong><br><br>
            
            <strong>1. Páginas Web con Chat IA</strong><br>
            • Diseño moderno y responsive<br>
            • Chatbot integrado que conoce tu negocio<br>
            • Captura automática de leads<br><br>
            
            <strong>2. Chatbots Inteligentes</strong><br>
            • WhatsApp, Facebook, Instagram<br>
            • Respuestas 24/7 con tono humano<br>
            • Entrenados con tus productos<br><br>
            
            <strong>3. Automatización de Ventas</strong><br>
            • Seguimiento automático de leads<br>
            • Integración con CRM<br>
            • Reportes y analytics<br><br>
            
            ¿Te interesa algún servicio específico?
        `;
        addChatMessage(message, 'ai');
    }

    async function handleLeadsSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('.leads-submit-btn');
        
        const leadData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            company: formData.get('company'),
            interest: formData.get('interest'),
            message: formData.get('message')
        };

        submitBtn.textContent = 'Enviando...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(LEADS_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(leadData),
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Ocultar formulario y mostrar mensaje de éxito
            form.style.display = 'none';
            addChatMessage(`¡Gracias ${leadData.name}! 🎉 Hemos recibido tu solicitud de asesoría sobre "${leadData.interest}". Un especialista de ITAI te contactará pronto al email ${leadData.email} para brindarte una propuesta personalizada.`, 'ai');
            
            showToast('success', '¡Solicitud Enviada!', 'Te contactaremos pronto');

        } catch (error) {
            console.error('Error al enviar lead:', error);
            submitBtn.textContent = 'Solicitar Asesoría 🚀';
            submitBtn.disabled = false;
            addChatMessage('Hubo un problema al enviar tu solicitud. Por favor intenta nuevamente o contáctanos directamente.', 'ai');
            showToast('error', 'Error', 'No se pudo enviar la solicitud');
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

    document.addEventListener('DOMContentLoaded', init);
})();