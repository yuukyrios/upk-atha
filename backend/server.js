// server.js
const app = require('./src/app');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`MechaDex Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});