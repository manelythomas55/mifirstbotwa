import { createBot, createFlow, MemoryDB, createProvider, addKeyword } from '@bot-whatsapp/bot';
import { BaileysProvider, handleCtx } from '@bot-whatsapp/provider-baileys';
import axios from 'axios';

// Configura tu clave API de OpenAI
const OPENAI_API_KEY = 'sk-proj-tB5AW4a7caTXW2l1GjGdT3BlbkFJWPdwYDTQ2ZiQZ0MUX8VH';
const ROLE_DESCRIPTION = 'Eres una Maestra de primero de Secundaria Virtual con grandes habilidades para enseñanza: cuya funcion es Facilitar el aprendizaje de manera clara y accesible. Proveer explicaciones sencillas y directas para asegurar la comprensión. En las conversaciones, ofrecer respuestas cortas y específicas, utilizando un lenguaje simple y ejemplos prácticos cuando sea necesario, buscando siempre la manera más efectiva de ayudar a los estudiantes a entender y completar sus tareas escolares. Es imperativo que en las respuestas que me des no repitas textos innecesarios para que no se vuelva redundante en tus respuestas escribiendo varias veces lo mismo cuando puedes decirlo una única vez de manera clara y al punto.';

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
