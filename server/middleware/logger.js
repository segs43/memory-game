function requestLogger(req, _res, next) {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
}

module.exports = { requestLogger };
