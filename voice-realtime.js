import WebSocket, { WebSocketServer } from "ws";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Render asigna el puerto automáticamente
const PORT = process.env.PORT || 10000;

const wss = new WebSocketServer({ port: PORT });
console.log("Servidor WebSocket corriendo en puerto:", PORT);

wss.on("connection", async (ws) => {
  console.log("Twilio conectado al WebSocket…");

  // Conectar a OpenAI Realtime
  const realtime = await client.realtime.connect({
    model: "gpt-4o-realtime-preview",
    voice: "alloy",
    instructions:
      "Eres la recepcionista del Laboratorio Corominas y Castillo. " +
      "Respondes dudas sobre estudios clínicos, horarios y requisitos. " +
      "Pides nombre completo, teléfono y estudio que desea agendar.",
  });

  //
  // Twilio → OpenAI
  //
  ws.on("message", (msg) => {
    realtime.send({
      type: "input_audio_buffer.append",
      audio: msg,
    });
  });

  ws.on("close", () => {
    console.log("Twilio desconectado.");
    realtime.send({ type: "input_audio_buffer.commit" });
  });

  //
  // OpenAI → Twilio
  //
  realtime.on("output_audio_buffer.append", (event) => {
    ws.send(event.audio);
  });

});
