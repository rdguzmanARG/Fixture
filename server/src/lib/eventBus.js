const clients = new Set();

export function subscribe(res) {
  clients.add(res);
}

export function unsubscribe(res) {
  clients.delete(res);
}

export function emit(eventName) {
  const payload = `event: ${eventName}\ndata: {}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch {
      unsubscribe(res);
    }
  }
}
