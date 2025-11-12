# ITAI Chat Server

Backend puente para alimentar el chat flotante del landing, generando respuestas con IA y notificando por WhatsApp.

## Requisitos

- Node.js 18+
- Cuenta en OpenAI (o proveedor compatible) y clave API
- Cuenta en Twilio con canal de WhatsApp Business aprobado

## Instalación

```bash
npm install
```

Copia `.env.example` a `.env` y ajusta los valores reales:

- `OPENAI_API_KEY`: clave del modelo de IA
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`: credenciales de Twilio
- `TWILIO_WHATSAPP_FROM`: número de WhatsApp Business provisionado por Twilio (prefijado con `whatsapp:`)
- `TWILIO_WHATSAPP_TO`: número destino para alertas (prefijado con `whatsapp:`)
- `ALLOWED_ORIGINS`: lista de orígenes permitidos para CORS (separados por comas)

## Uso

Ambiente de desarrollo con recarga automática:

```bash
npm run dev
```

Modo producción:

```bash
npm start
```

## Endpoints

### POST `/api/chat`

Cuerpo esperado:

```json
{
  "message": "Texto enviado por el usuario",
  "context": { "name": "Nombre opcional" }
}
```

La respuesta incluye:

- `reply`: texto generado por IA
- `sentAlert`: `true` si se envió notificación por WhatsApp
- `sid`: identificador del mensaje en Twilio (si aplica)

## Notas

- Ajusta el modelo (`OPENAI_MODEL`) según tu plan disponible.
- Añade autenticación (por ejemplo, API key propia) si expones el servicio públicamente.
- Para pruebas sin WhatsApp puedes omitir credenciales y el servidor ignorará el envío (log de advertencia).
