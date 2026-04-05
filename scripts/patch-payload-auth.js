import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Target files for the esm build
const esmAppSessionPath = path.resolve(
  __dirname,
  '../node_modules/payload-auth-plugin/dist/esm/core/session/app.js',
)

if (fs.existsSync(esmAppSessionPath)) {
  let content = fs.readFileSync(esmAppSessionPath, 'utf8')

  // Patch oauthAccountMutations
  const search1 = `const accountRecords = await payload.find({\\n      collection: this.collections.accountsCollection,\\n      where: {`
  const replace1 = `const accountRecords = await payload.find({\\n      collection: this.collections.accountsCollection,\\n      overrideAccess: true,\\n      where: {`
  content = content.replace(search1, replace1)

  // Patch oauthSessionCallback
  const search2 = `const userRecords = await payload.find({\\n      collection: this.collections.usersCollection,\\n      where: {`
  const replace2 = `const userRecords = await payload.find({\\n      collection: this.collections.usersCollection,\\n      overrideAccess: true,\\n      where: {`
  content = content.replace(search2, replace2)

  fs.writeFileSync(esmAppSessionPath, content, 'utf8')
  console.log('[scripts/patch-payload-auth.js] Patched payload-auth-plugin ESM build.')
} else {
  console.warn(
    '[scripts/patch-payload-auth.js] payload-auth-plugin ESM file not found at:',
    esmAppSessionPath,
  )
}

// Target files for the cjs build (if it exists)
const cjsAppSessionPath = path.resolve(
  __dirname,
  '../node_modules/payload-auth-plugin/dist/cjs/core/session/app.js',
)
if (fs.existsSync(cjsAppSessionPath)) {
  let content = fs.readFileSync(cjsAppSessionPath, 'utf8')

  // Patch oauthAccountMutations
  const search1 = `const accountRecords = await payload.find({\\n      collection: this.collections.accountsCollection,\\n      where: {`
  const replace1 = `const accountRecords = await payload.find({\\n      collection: this.collections.accountsCollection,\\n      overrideAccess: true,\\n      where: {`
  content = content.replace(search1, replace1)

  // Patch oauthSessionCallback
  const search2 = `const userRecords = await payload.find({\\n      collection: this.collections.usersCollection,\\n      where: {`
  const replace2 = `const userRecords = await payload.find({\\n      collection: this.collections.usersCollection,\\n      overrideAccess: true,\\n      where: {`
  content = content.replace(search2, replace2)

  fs.writeFileSync(cjsAppSessionPath, content, 'utf8')
  console.log('[scripts/patch-payload-auth.js] Patched payload-auth-plugin CJS build.')
}
