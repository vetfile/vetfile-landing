const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test server running' });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
