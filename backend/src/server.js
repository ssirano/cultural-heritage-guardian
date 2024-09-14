const app = require('./app');

const connectDB = require('./config/db');
require('dotenv').config();
const PORT = process.env.PORT || 5003;

connectDB();
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});