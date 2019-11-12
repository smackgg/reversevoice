import * as shell from 'shelljs'
import fs from 'fs'
export const prod = process.env.NODE_ENV === 'production' // Anything else is treated as 'dev'

const distPublicPath = 'dist/public'
const cp = () => {
  console.debug('public file build!')
  if (!fs.existsSync(distPublicPath)) {
    fs.mkdirSync(distPublicPath)
  }
  shell.cp('-R', 'src/public/*', distPublicPath)
}

cp()


// shell.cp('-R', 'src/public/js/lib', 'dist/public/js/')
// shell.cp('-R', 'src/public/fonts', 'dist/public/')
// shell.cp('-R', 'src/public/images', 'dist/public/')
