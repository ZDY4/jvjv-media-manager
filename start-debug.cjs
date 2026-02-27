const { spawn } = require('child_process');
const path = require('path');

const electronPath = path.join(__dirname, 'node_modules', '.bin', 'electron.cmd');
const child = spawn(electronPath, ['.', '--dev', '--remote-debugging-port=9223'], {
  cwd: __dirname,
  stdio: 'inherit'
});

child.on('exit', (code) => {
  console.log('Electron exited with code:', code);
});

console.log('Electron started with debugging port 9223');
