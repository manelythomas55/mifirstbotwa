import "dotenv/config";
import http from 'http';
import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot';
import { MemoryDB as Database } from '@builderbot/bot';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';
import { typing } from "./presence";
import { handleMessage } from './history';

const PORT = process.env.PORT || 3008;

interface MessageHistory {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const userHistories = new Map<string, MessageHistory[]>();

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
  .addAction(async (ctx, { flowDynamic, state, provider }) => {
    try {
      await typing(ctx, provider);

      // Obtener el historial del usuario, o crear uno nuevo si no existe
      let history = userHistories.get(ctx.from) || [
        { role: "user", parts: [{ text: "Inicio de conversación" }] },
        { role: "model", parts: [{ text: "¡Hola! ¿En qué puedo ayudarte hoy?" }] },
      ];

      // Handle the message and update the history
      const response = await handleMessage(ctx.from, ctx.body, history);

      // Guardar el historial actualizado en el mapa
      userHistories.set(ctx.from, history);

      // Send the entire response without splitting
      await flowDynamic([{ body: response }]);
    } catch (error) {
      console.error('Error in welcomeFlow:', error);

      // Send error message to the user
      await flowDynamic([{ body: 'Ha ocurrido un error. Por favor, intenta de nuevo más tarde.' }]);
    }
  });

const main = async () => {
  const adapterFlow = createFlow([welcomeFlow]);
  const adapterProvider = createProvider(Provider);
  const adapterDB = new Database();

  try {
    const { httpServer } = await createBot({
      flow: adapterFlow,
      provider: adapterProvider,
      database: adapterDB,
    });

    httpServer(+PORT);

    // Keep the server alive by pinging Google every 30 seconds using http
    setInterval(() => {
      const options = {
        hostname: 'www.google.com',
        port: 80,
        path: '/',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          console.log('Ping successful');
        } else {
          console.error('Ping failed', res.statusCode);
        }
      });

      req.on('error', (e) => {
        console.error('Error during ping:', e);
      });

      req.end();
    }, 48 * 1000); // 48 seconds

    console.log(`Server is listening on port ${PORT}`);
  } catch (error) {
    console.error('Error in main:', error);
  }
};

main();
