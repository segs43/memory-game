'use strict';

const COLORS = {
  GET:    '\x1b[32m',   // green
  POST:   '\x1b[33m',   // yellow
  DELETE: '\x1b[31m',   // red
  RESET:  '\x1b[0m',
};

function requestLogger(req, res, next) {
  const start  = Date.now();
  const ts     = new Date().toISOString().slice(11, 23);
  const color  = COLORS[req.method] ?? '';

  res.on('finish', () => {
    const ms      = Date.now() - start;
    const status  = res.statusCode;
    const scode   = status >= 400 ? `\x1b[31m${status}\x1b[0m` : `\x1b[32m${status}\x1b[0m`;
    console.log(`[${ts}] ${color}${req.method}${COLORS.RESET} ${req.path} → ${scode} (${ms}ms)`);
  });

  next();
}

module.exports = { requestLogger };
