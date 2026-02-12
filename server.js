/**
 * KING DEV ACADEMY - PONG ENGINE (SIMPLE VERSION)
 * Servidor para hospedagem e suporte básico
 */

const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Porta dinâmica para o Render ou 3000 local
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
    --------------------------------------------------
    KING DEV ACADEMY - SERVIDOR ATIVO
    Porta: ${PORT}
    Status: Pronto para jogar!
    --------------------------------------------------
    `);
});
