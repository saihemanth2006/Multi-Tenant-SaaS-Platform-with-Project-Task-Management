import app from './app.js';
import { config } from './config/env.js';

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend running on port ${config.port}`);
});
