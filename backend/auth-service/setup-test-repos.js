import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const baseDir = '/app/test-repos';

async function run() {
  console.log('Setting up local test repositories...');
  await fs.mkdir(baseDir, { recursive: true });

  // 1. Static HTML project
  const staticPath = path.join(baseDir, 'static');
  await fs.mkdir(staticPath, { recursive: true });
  await fs.writeFile(
    path.join(staticPath, 'index.html'),
    `<!DOCTYPE html>
<html>
<head>
  <title>Static Test</title>
  <style>
    body { font-family: sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    h1 { color: #38bdf8; }
  </style>
</head>
<body>
  <h1>Hello from DeployIQ Static Site!</h1>
</body>
</html>`
  );
  initGitRepo(staticPath);

  // 2. Node.js project
  const nodePath = path.join(baseDir, 'nodejs');
  await fs.mkdir(nodePath, { recursive: true });
  await fs.writeFile(
    path.join(nodePath, 'package.json'),
    JSON.stringify({
      name: "node-test",
      version: "1.0.0",
      main: "index.js",
      scripts: {
        start: "node index.js"
      },
      dependencies: {
        express: "^4.18.2"
      }
    }, null, 2)
  );
  await fs.writeFile(
    path.join(nodePath, 'index.js'),
    `import express from 'express';
const app = express();
const port = 3000;
app.get('/', (req, res) => res.send('Hello from DeployIQ Node.js App!'));
app.listen(port, () => console.log('Node app listening on port ' + port));`
  );
  initGitRepo(nodePath);

  // 3. Compose project
  const composePath = path.join(baseDir, 'compose');
  await fs.mkdir(composePath, { recursive: true });
  await fs.writeFile(
    path.join(composePath, 'compose.yaml'),
    `services:
  web:
    image: nginx:alpine
    ports:
      - "80"
`
  );
  initGitRepo(composePath);

  console.log('All local test repositories successfully set up in /app/test-repos/');
}

function initGitRepo(repoPath) {
  console.log(`Initializing git repo at ${repoPath}...`);
  execSync('git init', { cwd: repoPath });
  execSync('git config user.email "test@deployiq.com"', { cwd: repoPath });
  execSync('git config user.name "Test User"', { cwd: repoPath });
  execSync('git add .', { cwd: repoPath });
  execSync('git commit -m "initial commit"', { cwd: repoPath });
}

run().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
