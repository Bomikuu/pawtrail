import 'server-only'
import { constants } from 'node:fs'
import {
  lstat,
  mkdir,
  open,
  realpath,
  rename,
  rm,
  unlink,
} from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
import { join, resolve } from 'node:path'
import { ApiError } from '@/lib/api/errors'
import { demoClock } from './clock'
import {
  canonicalJson,
  serialize,
  type DemoCommand,
  type DemoQuery,
} from './transactions'
import {
  freshDocument,
  overlayFrom,
  parseDocument,
  snapshot,
  type StoredDemo,
} from './migrations'

export interface DemoRepository {
  readonly mediaRoot: string
  read<T>(query: DemoQuery<T>): Promise<T>
  transact<T>(command: DemoCommand<T>): Promise<T>
}
export function validateSessionId(sessionId: string): void {
  if (!/^[a-f0-9]{64}$/.test(sessionId))
    throw new ApiError('INVALID_DEMO_SESSION', 'Invalid demo session', 400)
}
function isMissing(error: unknown) {
  return (error as NodeJS.ErrnoException)?.code === 'ENOENT'
}
async function sessionPath(
  sessionId: string,
  dataDir: string,
): Promise<string> {
  validateSessionId(sessionId)
  const directory = resolve(dataDir)
  await mkdir(directory, { recursive: true, mode: 0o700 })
  if ((await lstat(directory)).isSymbolicLink())
    throw new ApiError('INVALID_DEMO_SESSION', 'Unsafe demo directory', 400)
  // Canonical directory means alternate spellings share the same transaction lock.
  return join(await realpath(directory), `${sessionId}.json`)
}
async function checkFile(path: string): Promise<void> {
  try {
    const stat = await lstat(path)
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1)
      throw new ApiError(
        'INVALID_DEMO_SESSION',
        'Unsafe demo session file',
        400,
      )
  } catch (error) {
    if (!isMissing(error)) throw error
  }
}
async function load(path: string): Promise<StoredDemo> {
  await checkFile(path)
  let file
  try {
    file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  } catch (error) {
    if (isMissing(error)) return freshDocument()
    throw error
  }
  try {
    return parseDocument(await file.readFile('utf8'))
  } finally {
    await file.close()
  }
}
async function replace(path: string, document: StoredDemo): Promise<void> {
  const content = canonicalJson(document)
  await checkFile(path)
  const temporary = `${path}.${randomUUID()}.tmp`
  const file = await open(temporary, 'wx', 0o600)
  try {
    await file.writeFile(content, 'utf8')
    await file.sync()
    await file.close()
    await rename(temporary, path)
  } catch (error) {
    await file.close().catch(() => undefined)
    await unlink(temporary).catch(() => undefined)
    throw error
  }
}
export async function openDemoRepository(
  sessionId: string,
  dataDir: string,
): Promise<DemoRepository> {
  const path = await sessionPath(sessionId, dataDir)
  await serialize(path, () => load(path))
  return {
    mediaRoot: join(resolve(dataDir), `${sessionId}.media`),
    async read(query) {
      const state = await serialize(path, () => load(path))
      return query(snapshot(state))
    },
    async transact(command) {
      if (
        !command.name ||
        command.name.length > 200 ||
        (command.idempotencyKey !== undefined &&
          (!command.idempotencyKey || command.idempotencyKey.length > 200))
      )
        throw new ApiError(
          'VALIDATION_ERROR',
          'Invalid demo command identity',
          400,
        )
      const fingerprint = createHash('sha256')
        .update(canonicalJson(command.input))
        .digest('hex')
      return serialize(path, async () => {
        const document = await load(path)
        const receipt =
          command.idempotencyKey === undefined
            ? undefined
            : document.receipts.find(
                (entry) =>
                  entry.actorId === document.auth.actorId &&
                  entry.name === command.name &&
                  entry.key === command.idempotencyKey,
              )
        if (receipt) {
          if (receipt.fingerprint !== fingerprint)
            throw new ApiError(
              'CONFLICT',
              'This idempotency key was used with different input',
              409,
            )
          return structuredClone(receipt.result) as Awaited<
            ReturnType<typeof command.execute>
          >
        }
        const receiptActorId = document.auth.actorId
        const draft = snapshot(document)
        const result = await command.execute(draft, demoClock)
        // Verify output before any file write, including commands without a receipt.
        const storedResult =
          result === undefined ? undefined : JSON.parse(canonicalJson(result))
        document.overlay = overlayFrom(draft)
        document.auth = draft.auth
        document.moderation = draft.moderation
        document.community = draft.community
        document.media = draft.media
        document.savedAnimals = draft.savedAnimals
        document.workflow = draft.workflow
        if (command.idempotencyKey !== undefined)
          document.receipts.push({
            name: command.name,
            actorId: receiptActorId,
            key: command.idempotencyKey,
            fingerprint,
            ...(storedResult === undefined ? {} : { result: storedResult }),
          })
        parseDocument(canonicalJson(document))
        await replace(path, document)
        return structuredClone(storedResult)
      })
    },
  }
}
/** Explicit reset skips schema decoding so damaged/old sessions remain recoverable. */
export async function resetRepository(
  sessionId: string,
  dataDir: string,
): Promise<void> {
  const path = await sessionPath(sessionId, dataDir)
  await serialize(path, async () => {
    await replace(path, freshDocument())
    await rm(join(resolve(dataDir), `${sessionId}.media`), {
      recursive: true,
      force: true,
    })
  })
}
