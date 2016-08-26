/*jshint esversion: 6 */
const {app, ipcMain, globalShortcut, BrowserWindow} = require('electron');
const Menubar = require('menubar');

// // our "app" instance
// const menubar = Menubar({
//     icon: './earth-icon.png',
//     alwaysOnTop: true, // if true, the window will not hide on blur
//     height: 330,
//     width: 300
// });
//
// // when ready log:
// menubar.on('ready', function () {
//     console.log('Application is ready.');
//     menubar.showWindow();
// });
//
// // after menubar creates our BrowserWindow:
// menubar.on('after-create-window', function () {
//     menubar.window.loadURL(`file://${__dirname}/index.html`);
//     menubar.window.openDevTools({mode:'detach'});
// });
//
// menubar.app.on('will-quit', function () {
//     globalShortcut.unregisterAll();
//     menubar.window = null;
// });

let mainWindow;
function createWindow () {
    // Create the browser window.

    mainWindow = new BrowserWindow({
        title: 'API-Connect',
        width: 1200,
        height: 800,
        // fullscreen: true,
        center: true,
        backgroundColor: '#3A5A40',
    });

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/index.html`);

    // Open the DevTools.
    mainWindow.webContents.openDevTools({mode:'bottom'});

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('popout-message', (event, arg) => {
  console.log('popout [off]',arg);  // prints "ping"
  createWindow();
  menubar.hideWindow();
  event.sender.send('popout-reply', 'popout [off]');
});
