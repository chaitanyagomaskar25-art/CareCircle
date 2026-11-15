import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..');

async function main() {
  let serverProc = null;
  let alreadyRunning = false;

  try {
    const healthRes = await fetch('http://localhost:5000/api/v1/health');
    if (healthRes.ok) {
      alreadyRunning = true;
      console.log('>>> [TEST SUITE] Server is already running on port 5000. Executing test suites...\n');
    }
  } catch {
    // Server is not running, will spawn
  }

  if (!alreadyRunning) {
    console.log('>>> [TEST SUITE] Launching CareCircle API Server in background...');
    serverProc = spawn('node', ['src/server.js'], {
      cwd: serverDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PORT: '5000' },
    });

    let serverStarted = false;

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server did not start within 8 seconds'));
      }, 8000);

      serverProc.stdout.on('data', (data) => {
        const msg = data.toString();
        if (msg.includes('CareCircle API Server running on port') || msg.includes('Health Check')) {
          serverStarted = true;
          clearTimeout(timeout);
          resolve();
        }
      });

      serverProc.stderr.on('data', (data) => {
        const err = data.toString();
        if (!serverStarted) {
          console.error('[Server Error Output]:', err);
        }
      });

      serverProc.on('exit', (code) => {
        if (!serverStarted) {
          clearTimeout(timeout);
          reject(new Error(`Server exited prematurely with code ${code}`));
        }
      });
    });

    console.log('>>> [TEST SUITE] Server is listening. Running test suites...\n');
  }

  const runTest = (testFile) => {
    return new Promise((resolve) => {
      console.log(`\n========================================================`);
      console.log(` RUNNING: ${testFile}`);
      console.log(`========================================================`);
      const proc = spawn('node', [testFile], {
        cwd: serverDir,
        stdio: 'inherit',
      });
      proc.on('exit', (code) => {
        resolve(code);
      });
    });
  };

  try {
    const authCode = await runTest('test/auth.test.js');
    const circleCode = await runTest('test/careCircle.test.js');
    const medsCode = await runTest('test/medication.test.js');
    const notifCode = await runTest('test/notification.test.js');
    const caregiverCode = await runTest('test/caregiver.test.js');
    const familyCode = await runTest('test/family.test.js');

    console.log('\n========================================================');
    console.log(`ALL TESTS FINISHED. Exit codes: auth=${authCode}, circle=${circleCode}, meds=${medsCode}, notif=${notifCode}, caregiver=${caregiverCode}, family=${familyCode}`);
    console.log('========================================================');

    if (serverProc) serverProc.kill('SIGTERM');

    if (authCode !== 0 || circleCode !== 0 || medsCode !== 0 || notifCode !== 0 || caregiverCode !== 0 || familyCode !== 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    if (serverProc) serverProc.kill('SIGTERM');
    process.exit(1);
  }
}

main();
