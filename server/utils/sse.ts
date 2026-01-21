import { H3Event } from 'h3';

type SSESession = {
  id: string;
  res: any;
};

// Simple in-memory store for connections
// Note: In a serverless environment like Vercel, this has limitations as instances are ephemeral.
// For production serverless, you'd typically use a service like Pusher, Ably, or a database-backed solution.
// However, for a long-running Node server (VPS) or local dev, this works perfectly.
const clients = new Set<SSESession>();

export const addClient = (event: H3Event) => {
  const id = crypto.randomUUID();
  // @ts-ignore
  const res = event.node.res;
  
  const client: SSESession = { id, res };
  clients.add(client);

  // Remove client on connection close
  event.node.req.on('close', () => {
    clients.delete(client);
  });

  return id;
};

export const broadcastRaw = (data: string) => {
  clients.forEach((client) => {
    client.res.write(`data: ${data}\n\n`);
  });
};

export const broadcast = (event: string, data: any) => {
  const payload = JSON.stringify({ event, data });
  broadcastRaw(payload);
};
