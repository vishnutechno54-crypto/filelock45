const fs = require('fs');
const path = require('path');

const loadEnv = ({ cwd = process.cwd(), dirname = __dirname } = {}) => {
  const rootDir = path.resolve(cwd);
  const backendDir = path.resolve(dirname, '..');
  const candidateEnvFiles = [];

  const addCandidate = (envPath) => {
    if (envPath && fs.existsSync(envPath) && !candidateEnvFiles.includes(envPath)) {
      candidateEnvFiles.push(envPath);
    }
  };

  addCandidate(path.join(rootDir, '.env'));
  addCandidate(path.join(rootDir, 'backend', '.env'));
  addCandidate(path.join(backendDir, '.env'));
  addCandidate(path.join(path.resolve(backendDir, '..'), '.env'));

  for (const envPath of candidateEnvFiles) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }

  return { parsed: process.env };
};

module.exports = loadEnv;
