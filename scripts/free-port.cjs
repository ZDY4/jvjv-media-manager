#!/usr/bin/env node
const { execSync } = require('child_process');

const portArg = process.argv[2];
const port = Number(portArg || 5173);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  console.error(`[free-port] Invalid port: ${portArg}`);
  process.exit(1);
}

function parsePidsFromWindowsNetstat(output) {
  const pids = new Set();
  const lines = output.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  for (const line of lines) {
    if (!line.toUpperCase().includes('LISTENING')) continue;
    const parts = line.split(/\s+/);
    const pidStr = parts[parts.length - 1];
    const pid = Number(pidStr);
    if (Number.isInteger(pid) && pid > 0) {
      pids.add(pid);
    }
  }
  return Array.from(pids);
}

function getListeningPids(checkPort) {
  try {
    if (process.platform === 'win32') {
      const psCommand = [
        '$ErrorActionPreference = "SilentlyContinue";',
        `Get-NetTCPConnection -LocalPort ${checkPort} -State Listen |`,
        'Select-Object -ExpandProperty OwningProcess',
      ].join(' ');
      const output = execSync(`powershell -NoProfile -Command "${psCommand}"`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return output
        .split(/\r?\n/)
        .map(item => Number(item.trim()))
        .filter(pid => Number.isInteger(pid) && pid > 0);
    }

    const output = execSync(`lsof -ti tcp:${checkPort} -sTCP:LISTEN`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return output
      .split(/\r?\n/)
      .map(item => Number(item.trim()))
      .filter(pid => Number.isInteger(pid) && pid > 0);
  } catch {
    return [];
  }
}

function killPid(pid) {
  try {
    if (pid === process.pid) return;
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    } else {
      process.kill(pid, 'SIGKILL');
    }
    console.log(`[free-port] Killed process ${pid} on port ${port}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[free-port] Failed to kill PID ${pid}: ${message}`);
  }
}

function main() {
  const pids = getListeningPids(port);
  if (pids.length === 0) {
    console.log(`[free-port] Port ${port} is available`);
    return;
  }

  for (const pid of pids) {
    killPid(pid);
  }

  const remaining = getListeningPids(port);
  if (remaining.length > 0) {
    console.warn(`[free-port] Port ${port} is still occupied after cleanup`);
  } else {
    console.log(`[free-port] Port ${port} has been released`);
  }
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[free-port] Unexpected error: ${message}`);
  process.exit(1);
}
