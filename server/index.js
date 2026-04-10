const express = require('express');
const cors = require('cors');
const saveRoutes = require('./routes/save');
const leaderboardRoutes = require('./routes/leaderboard');
const { requestLogger } = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(requestLogger);

app.use('/api/save', saveRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[Memory Thief Server] Running on http://localhost:${PORT}`);
});
