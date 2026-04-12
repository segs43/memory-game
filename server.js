import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import net from 'net';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function findFreePort(start) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.unref();
    s.on('error', () => resolve(findFreePort(start + 1)));
    s.listen(start, () => { const { port } = s.address(); s.close(() => resolve(port)); });
  });
}

const port = await findFreePort(3000);
app.listen(port, () => {
  console.log(`\n🧠 Memory Thief → http://localhost:${port}\n`);
});
