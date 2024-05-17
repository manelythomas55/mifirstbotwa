import { createBot, createFlow, MemoryDB, createProvider, addKeyword } from '@bot-whatsapp/bot';
import { BaileysProvider, handleCtx } from '@bot-whatsapp/provider-baileys';
import axios from 'axios';

// Configura tu clave API de OpenAI
const OPENAI_API_KEY = 'tu-clave-api-de-openai';
const ROLE_DESCRIPTION = 'maestra con grandes habilidades para explicar las tareas de secundaria';

async function getOpenAIResponse(prompt) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: `Actúa como ${ROLE_DESCRIPTION}` },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(`Error al obtener la respuesta de OpenAI: ${error.message}`);
    return 'Lo siento, hubo un problema al procesar tu solicitud. Inténtalo de nuevo más tarde.';
  }
}

// Define el flujo que contiene la acción para manejar los mensajes entrantes
const flowConversacion = addKeyword('').addAction(async (ctx) => {
  try {
    // Imprimir el mensaje entrante
    console.log(`[MENSAJE ENTRANTE]: ${ctx.body}`);

    // Obtener respuesta de OpenAI
    const respuesta = await getOpenAIResponse(ctx.body);
    await ctx.reply(respuesta);
  } catch (error) {
    console.error(`Error al procesar el mensaje: ${error.message}`);
    await ctx.reply('Lo siento, hubo un problema al procesar tu mensaje. Inténtalo de nuevo más tarde.');
  }
});

const main = async () => {
  try {
    // Crea el proveedor de Baileys
    const provider = createProvider(BaileysProvider);
    provider.initHttpServer(3002);

    // Crea el bot con el flujo modificado y el proveedor
    await createBot({
      flow: createFlow([flowConversacion]),
      database: new MemoryDB(),
      provider
    });

    console.log('El bot está en funcionamiento.');
  } catch (error) {
    console.error(`Error al iniciar el bot: ${error.message}`);
    // Reiniciar el bot después de un breve retraso
    setTimeout(main, 5000); // Reintentar después de 5 segundos
  }
};

// Ejecutar el bot por primera vez
main();
