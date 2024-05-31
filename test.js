import PicoController from './index.js'
import path from 'path'
import { fileURLToPath } from 'url'


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


async function main() {
  const pico = new PicoController()
  
  const found = await pico.findPico()
  
  
  if (!found) {
      console.error('Pico not found.')
      return
  }
  
  
  console.log('HOLD THE BOOT BUTTON -> Attempting restart into FS mode')
  
  
  // wait 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  
  try {
    await pico.restartInFSMode();
  } catch (error) {
    console.error('Error restarting in FS mode:', error);
  }
  
  
  const uf2Path = path.join(__dirname, 'path_to_your.uf2')
  
  try {
    await pico.loadUF2(uf2Path);
    console.log('UF2 file loaded.');
  } catch (error) {
    console.error('Error loading UF2 file:', error);
  }
  
  
  const pyFilePath = path.join(__dirname, 'path_to_your.py')
  
  try {
    await pico.sendPyFile(pyFilePath);
    console.log('Python file sent.');
  } catch (error) {
    console.error('Error sending Python file:', error);
  }
}


main().catch(console.error)