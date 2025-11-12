import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { OpenAI } from 'openai';
import twilio from 'twilio';

dotenv.config();

const {
    PORT = 4000,
    ALLOWED_ORIGINS = '',
    OPENAI_API_KEY,
    OPENAI_MODEL = 'gpt-4o-mini',
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_FROM,
    TWILIO_WHATSAPP_TO
} = process.env;

const app = express();

const allowedOrigins = ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            callback(null, origin);
            return;
        }
        callback(new Error('Origin not allowed by CORS'));
    }
}));

app.use(express.json());

let aiClient = null;
if (OPENAI_API_KEY) {
    aiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
} else {
    console.warn('OPENAI_API_KEY is not set. AI replies will be skipped.');
}

let twilioClient = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM && TWILIO_WHATSAPP_TO) {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
} else {
    console.warn('Twilio credentials are incomplete. WhatsApp alerts will be skipped.');
}

async function generateReply(message, context = {}) {
    if (!aiClient) {
        return 'Gracias por tu mensaje. Un asesor se comunicará contigo pronto.';
    }

    const systemPrompt = `Eres el asistente virtual de ITAI, una empresa especializada en desarrollo web y chatbots con IA.

INFORMACIÓN DE ITAI:
- Especialistas en páginas web modernas con chat IA integrado
- Desarrollamos chatbots que entienden productos específicos de cada negocio
- Ofrecemos respuesta inmediata 24/7 con tono humano y natural
- Entrenamos la IA con catálogos, FAQ y promociones del cliente
- Sistema de captura de leads y alertas automáticas a WhatsApp
- Soluciones personalizadas para cada tipo de negocio

SERVICIOS PRINCIPALES:
1. Páginas web con chatbot IA integrado
2. Chatbots personalizados para WhatsApp/Facebook
3. Sistemas de automatización de ventas
4. Integración con CRM y bases de datos
5. Asesoría y capacitación en herramientas digitales

TONO: Conversacional, humano, cercano y profesional. Como si fueras parte del equipo de ITAI.
OBJETIVO: Entender la necesidad del cliente y guiarlo hacia una asesoría personalizada.

Responde de manera natural, pregunta detalles sobre su negocio si es necesario, y siempre ofrece una asesoría personalizada como próximo paso.

Contexto adicional: ${JSON.stringify(context)}`;

    const completion = await aiClient.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
        ],
        max_tokens: 200,
        temperature: 0.7
    });

    const output = completion.choices?.[0]?.message?.content;
    return output?.trim() || 'Gracias por escribirnos. Un especialista de ITAI te contactará pronto para brindarte la mejor solución para tu negocio.';
}

async function sendWhatsAppAlert({ message, reply, context, leadInfo = null }) {
    if (!twilioClient) {
        return { sent: false, sid: null };
    }

    let text = `🤖 *NUEVO LEAD - Chat ITAI*\n\n`;
    text += `💬 *Mensaje del cliente:*\n${message}\n\n`;
    text += `🧠 *Respuesta IA:*\n${reply}\n\n`;
    
    if (leadInfo) {
        text += `👤 *Datos del lead:*\n`;
        text += `Nombre: ${leadInfo.name || 'No proporcionado'}\n`;
        text += `Email: ${leadInfo.email || 'No proporcionado'}\n`;
        text += `Teléfono: ${leadInfo.phone || 'No proporcionado'}\n`;
        text += `Empresa: ${leadInfo.company || 'No proporcionado'}\n\n`;
    }
    
    text += `🕐 *Fecha:* ${new Date().toLocaleString('es-ES')}\n`;
    text += `📊 *Contexto:* ${JSON.stringify(context)}`;

    const response = await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_FROM,
        to: TWILIO_WHATSAPP_TO,
        body: text
    });

    return { sent: true, sid: response.sid };
}

app.post('/api/chat', async (req, res) => {
    try {
        const { message, context, leadInfo } = req.body || {};

        if (!message || typeof message !== 'string') {
            res.status(400).json({ error: 'El campo "message" es obligatorio.' });
            return;
        }

        const reply = await generateReply(message, context);
        const alert = await sendWhatsAppAlert({ message, reply, context, leadInfo });

        res.json({ 
            reply, 
            sentAlert: alert.sent, 
            sid: alert.sid ?? null,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error en /api/chat:', error);
        res.status(500).json({ error: 'No se pudo procesar la solicitud.' });
    }
});

// Nuevo endpoint para capturar leads
app.post('/api/leads', async (req, res) => {
    try {
        const { name, email, phone, company, message, interest } = req.body || {};

        if (!email || !message) {
            res.status(400).json({ error: 'Email y mensaje son obligatorios.' });
            return;
        }

        const leadInfo = { name, email, phone, company, interest };
        const context = { source: 'lead_form', timestamp: new Date().toISOString() };
        
        const reply = `Gracias ${name || 'por contactarnos'}. Hemos recibido tu consulta sobre ${interest || 'nuestros servicios'}. Un especialista de ITAI te contactará pronto al email ${email} para brindarte una propuesta personalizada.`;
        
        const alert = await sendWhatsAppAlert({ 
            message: `LEAD CAPTURADO: ${message}`, 
            reply, 
            context, 
            leadInfo 
        });

        res.json({ 
            success: true,
            message: 'Lead capturado exitosamente',
            sentAlert: alert.sent,
            sid: alert.sid ?? null
        });
    } catch (error) {
        console.error('Error en /api/leads:', error);
        res.status(500).json({ error: 'No se pudo procesar el lead.' });
    }
});

app.get('/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Chat server listening on http://localhost:${PORT}`);
});
