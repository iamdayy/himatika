import { addClient } from "~~/server/utils/sse";

export default defineEventHandler(async (event) => {
  // Set headers for SSE
  setHeader(event, "Content-Type", "text/event-stream");
  setHeader(event, "Cache-Control", "no-cache");
  setHeader(event, "Connection", "keep-alive");
  setResponseStatus(event, 200);

  // Add client to the list
  addClient(event);

  // Send initial ping to establish connection
  const initialData = JSON.stringify({ event: 'connected', data: { message: 'SSE Connection Established' } });
  event.node.res.write(`data: ${initialData}\n\n`);

  // Return a promise that never resolves to keep the connection open
  // This is crucial for SSE in H3
  return new Promise(() => {
    // Connection stays open until client disconnects
  });
});
