/**
 * KING DEV ACADEMY - SERVER CORE
 * Simples e eficiente para hospedar a aplicação.
 */
const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Servir arquivos estáticos da pasta raiz
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[KING DEV ACADEMY] Servidor rodando na porta ${PORT}`);
});
