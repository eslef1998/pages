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

    const systemPrompt = `Eres el asistente virtual de ITAI. Responde en español con tono cercano, resume la solicitud y ofrece próximo paso. Información de apoyo: ${JSON.stringify(context)}.`;

    const completion = await aiClient.responses.create({
        model: OPENAI_MODEL,
        input: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
        ]
    });

    const output = completion.output?.[0]?.content?.[0]?.text;
    return output?.trim() || 'Gracias por escribirnos. Pronto te contactaremos.';
}

async function sendWhatsAppAlert({ message, reply, context }) {
    if (!twilioClient) {
        return { sent: false, sid: null };
    }

    const text = `Nuevo mensaje en el chat ITAI:\n\nCliente: ${message}\nRespuesta IA: ${reply}\nContexto: ${JSON.stringify(context)}`;

    const response = await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_FROM,
        to: TWILIO_WHATSAPP_TO,
        body: text
    });

    return { sent: true, sid: response.sid };
}

app.post('/api/chat', async (req, res) => {
    try {
        const { message, context } = req.body || {};

        if (!message || typeof message !== 'string') {
            res.status(400).json({ error: 'El campo "message" es obligatorio.' });
            return;
        }

        const reply = await generateReply(message, context);
        const alert = await sendWhatsAppAlert({ message, reply, context });

        res.json({ reply, sentAlert: alert.sent, sid: alert.sid ?? null });
    } catch (error) {
        console.error('Error en /api/chat:', error);
        res.status(500).json({ error: 'No se pudo procesar la solicitud.' });
    }
});

app.get('/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Chat server listening on http://localhost:${PORT}`);
});
