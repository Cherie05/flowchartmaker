import { existsSync } from 'node:fs';
import path from 'node:path';
import { createApp } from './app';
import { loadServerEnvironment } from './config/env';

const { config, projectRoot } = loadServerEnvironment();
const distributionDirectory = path.join(projectRoot, 'dist');
const app = createApp({
  config,
  staticDirectory: existsSync(path.join(distributionDirectory, 'index.html')) ? distributionDirectory : undefined,
});

app.listen(config.port, '127.0.0.1', () => {
  process.stdout.write(`Wizzleflow server listening on http://127.0.0.1:${config.port}\n`);
});
