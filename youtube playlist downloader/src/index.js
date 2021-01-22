const electron = require("electron");
const path = require("path");
const { app, BrowserWindow,Menu,ipcMain } = electron;


function createWindow () {
    const win = new BrowserWindow({
      width: 800,
      icon:path.resolve(__dirname,"../download.png"),
      height: 600,
      resizable:false,
      webPreferences: {
        nodeIntegration: true
      }
    })
  
    win.loadFile(path.resolve(__dirname,"./index.html"))
    win.setMenu(new Menu([]));
    ipcMain.on("win:close",()=>{
        win.close();
    })
  }
  
  app.whenReady().then(createWindow)
  
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })