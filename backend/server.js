require('dotenv').config();
const http = require('http');
const app = require('./app');

const PORT = process.env.PORT || 8000;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`MediConnect Backend running on http://localhost:${PORT}`);
});
