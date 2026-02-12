const express = require('express');
const http = require('http');
const path = require('path');
const app = express();
const server = http.createServer(app);

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`[KING DEV ACADEMY] Servidor ativo em: http://localhost:${PORT}`));
