import 'dotenv/config';
import createApp from './app.js';
import connectDB from './config/db.js';
import { getJwtSecret, redactSecrets } from './utils/auth.js';

const app = createApp();
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    getJwtSecret();
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Backend server listening on port ${PORT}.`);
    });

    server.on('error', (error) => {
      console.error(`Backend server failed to start: ${error.message}`);
      process.exitCode = 1;
    });
  } catch (error) {
    console.error(`Backend startup failed: ${redactSecrets(error.message)}`);
    process.exitCode = 1;
  }
}

startServer();
