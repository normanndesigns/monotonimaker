const electron = require('electron')
const path = require('path')

const { app, BrowserWindow } = electron

let win = null
function createWindow () {
  win = new BrowserWindow({ width: 1100, minWidth: 1050, height: 420, minHeight: 420, frame: false, transparent: true, webPreferences: {nodeIntegration: true, enableRemoteModule: true, worldSafeExecuteJavaScript: true}})
  win.loadFile(path.join(__dirname, 'public/index.html'))
}
app.on('ready', createWindow)