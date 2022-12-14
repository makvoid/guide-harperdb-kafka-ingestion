const async = require('async')
const { randomUUID } = require('crypto')
const execa = require('execa')
const fs = require('fs-extra')
const glob = require('glob')
const https = require('https')
const fetch = require('node-fetch')
const path = require('path')
const tar = require('tar-stream')
const util = require('util')
const globPromise = util.promisify(glob.glob)
const pack = tar.pack()

// Required configuration
const HDB_INSTANCE_IP = '172.1.1.1'
const HDB_INSTANCE_PORT = 9925
const HDB_USERNAME = 'clusteradm'
const HDB_PASSWORD = ''
const HDB_PROJECT_NAME = 'orders'

// Defaults
const ENCODED_CREDENTIALS = Buffer.from(`${HDB_USERNAME}:${HDB_PASSWORD}`).toString('base64')
const HDB_CUSTOM_FUNCTION_DIRECTORY = path.resolve(__dirname, '../custom-functions')
const FRONTEND_BUILD_PATH = path.resolve(__dirname, '../frontend/dist/frontend')

// Change working directory
process.chdir(HDB_CUSTOM_FUNCTION_DIRECTORY)

/**
 * Checks if a file exists
 *
 * @param {string} path file path to check
 * @returns boolean
 */
const fileExists = async (path) => {
  try {
    await fs.promises.access(path, fs.constants.F_OK)
  } catch (_e) {
    return false
  }
  return true
}

/**
 * Returns a promise from execa and automatically pipes stdout/stderr to the current process
 *
 * @param {string} cmd command to run
 * @param {string[]} args args to pass to command
 * @returns Promise<ExecaChildProcess>
 */
const execPipe = async (cmd, args = []) => {
  const promise = execa(cmd, args)

  // Pipe child process stdout/stderr to the current process
  // (or else we can't see the output)
  promise.stdout.pipe(process.stdout)
  promise.stderr.pipe(process.stderr)

  return promise
}

const main = async () => {
  // Ensure the Frontend has been built and is available to copy
  if (!await fileExists(FRONTEND_BUILD_PATH)) {
    console.error('Frontend build is missing. Will attempt to build before packaging - please wait.')

    // Change to the frontend's directory and build the application
    process.chdir(path.resolve(__dirname, '../frontend'))
    try {
      // Ensure the dependencies are installed beforehand
      await execPipe('yarn')

      // Run the build command
      await execPipe('npx', [
        'ng',
        'build',
        '--base-href',
        `https://${HDB_INSTANCE_IP}:9926/${HDB_PROJECT_NAME}/static/`
      ])
    } catch (e) {
      console.error(e)
      process.exit(1)
    }

    // Change back to the Custom Functions directory
    process.chdir(HDB_CUSTOM_FUNCTION_DIRECTORY)

    // Ensure the build succeeded
    if (!await fileExists(FRONTEND_BUILD_PATH)) {
      console.error('Frontend could not be built automatically. Please review for any errors and resolve them before continuing.')
      process.exit(1)
    }
  }

  // Copy the frontend to the Custom Functions directory
  await fs.copy(FRONTEND_BUILD_PATH, path.resolve('./static'), { overwrite: true })

  // Find all files (no directories) within the Custom Functions directory
  const files = await globPromise('**/*.*', { nodir: true })
  console.log('Found a total of', files.length, 'files to add to the archive.')

  // Iterate through each file and add it to the archive
  await async.each(files, async (name) => {
    // Read the file contents
    let fileContents
    try {
      fileContents = await fs.promises.readFile(name, 'utf-8')
    } catch (e) {
      console.error(e)
      process.exit(1)
    }
    pack.entry({ name }, fileContents)
  })

  // Craft the deployment request
  const operation = {
    operation: 'deploy_custom_function_project',
    project: HDB_PROJECT_NAME,
    file: `/tmp/${randomUUID()}.tar`,
    payload: pack.read().toString('base64')
  }

  // Attempt to upload the package
  let request
  let result
  try {
    console.log('Deploying the project to HarperDB, please wait...')
    request = await fetch(`https://${HDB_INSTANCE_IP}:${HDB_INSTANCE_PORT}`, {
      method: 'POST',
      body: JSON.stringify(operation),
      headers: {
        Authorization: `Basic ${ENCODED_CREDENTIALS}`,
        'Content-Type': 'application/json'
      },
      agent: new https.Agent({
        rejectUnauthorized: false
      })
    })
    result = await request.json()
  } catch (e) {
    console.error('Error: Status', request.status, request.statusText)
    console.error(e)
    if (request.status === 502) {
      console.error('Even though this error has occurred, the project has most likely still been deployed.')
    }
    return
  }

  // Display results of operation
  console.log('Deployment has finished -', result.error ? result.error : result.message)
  process.exit(result.error ? 1 : 0)
}
main()
