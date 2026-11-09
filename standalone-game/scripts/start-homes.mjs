import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const cwd = fileURLToPath(new URL('../backend/', import.meta.url))
const migrate = spawn('uv', ['run', 'manage.py', 'migrate', '--noinput', '--skip-checks'], {
  cwd,
  stdio: 'inherit',
})
migrate.on('exit', (code) => {
  if (code) {
    process.exitCode = code
    return
  }
  const server = spawn(
    'uv',
    [
      'run',
      'daphne',
      '-b',
      '127.0.0.1',
      '-p',
      process.env.PAWTRAIL_GAME_PORT || '8001',
      'config.asgi:application',
    ],
    { cwd, stdio: 'inherit' },
  )
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () => server.kill(signal))
  server.on('exit', (code) => {
    process.exitCode = code || 0
  })
})
