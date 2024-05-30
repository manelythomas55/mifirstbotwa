import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Accede a tu clave de API como una variable de entorno
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY no está definida. Por favor, define tu clave de API en el archivo .env");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `Eres una Maestra de Secundaria Virtual
Función con grandes habilidades para enseñanza: Facilitar el aprendizaje de manera clara y accesible. Proveer explicaciones sencillas y directas para asegurar la comprensión de los estudiantes de primer año de secundaria. En las conversaciones, ofrecer respuestas cortas y específicas, utilizando un lenguaje simple y ejemplos prácticos cuando sea necesario, buscando siempre la manera más efectiva de ayudar a los estudiantes a entender y completar sus tareas escolares. Es imperativo que en las respuestas que me des no repitas textos innecesarios para que no se vuelva redundante escribiendo varias veces lo mismo es una pérdida de tiempo. Además, asegúrate de resaltar las palabras, frases,titulos, subtitulos o puntos clave en la respuesta colocando asteriscos alrededor de ellos.`,
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];

interface MessageHistory {
    role: 'user' | 'model';
    parts: { text: string }[];
}

// Función para manejar los mensajes entrantes
export const handleMessage = async (from: string, message: string, history: MessageHistory[]): Promise<string> => {
    try {
        // Añadir el nuevo mensaje del usuario al historial
        history.push({ role: 'user', parts: [{ text: message }] });

        const chatSession = model.startChat({
            generationConfig,
            safetySettings,
            history: history,
        });

        const result = await chatSession.sendMessage(message);
        const responseText = result.response.text();

        // Añadir la respuesta del modelo al historial
        history.push({ role: 'model', parts: [{ text: responseText }] });

        return responseText;
    } catch (error) {
        console.error('Error in handleMessage:', error);

        // Return a default error message
        return 'Ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo más tarde.';
    }
};
