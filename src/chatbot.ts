import "dotenv/config";
import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot';
import { MemoryDB as Database } from '@builderbot/bot';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';
import { typing } from "./presence";
import { handleMessage } from './history';

const PORT = process.env?.PORT ?? 3008;

interface MessageHistory {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const history: MessageHistory[] = [
  {
    role: "user",
    parts: [{ text: "Inicio de conversación" }],
  },
  {
    role: "model",
    parts: [{ text: "¡Hola! ¿En qué puedo ayudarte hoy?" }],
  },
];

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
  .addAction(async (ctx, { flowDynamic, state, provider }) => {
    try {
      await typing(ctx, provider);

      // Handle the message and update the history
      const response = await handleMessage(ctx.from, ctx.body, history);

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
  } catch (error) {
    console.error('Error in main:', error);
  }
};

main();
