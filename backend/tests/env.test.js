const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tempWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'filelocker-env-'));
const backendDir = path.join(tempWorkspace, 'backend');
const envFilePath = path.join(backendDir, '.env');
fs.mkdirSync(backendDir, { recursive: true });
fs.writeFileSync(envFilePath, 'MONGODB_URI=mongodb://example.test\n');

test('loads the backend .env file when the app starts from the project root', () => {
  const envModulePath = path.resolve(__dirname, '../config/env');
  delete require.cache[require.resolve(envModulePath)];
  delete process.env.MONGODB_URI;

  const loadEnv = require(envModulePath);
  const result = loadEnv({ cwd: tempWorkspace, dirname: backendDir });

  assert.equal(result.parsed.MONGODB_URI, 'mongodb://example.test');
  assert.equal(process.env.MONGODB_URI, 'mongodb://example.test');
});
