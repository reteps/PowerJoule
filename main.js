const { app, BrowserWindow, Menu, Tray, ipcMain } = require('electron')
const powerschool = require('powerschool-api')
let win = null
let tray = null
const template = [
    {
        label: 'Grades',
        type: 'radio'
    },
    { label: 'Settings', click() { openSettings() } },
    { label: 'Quit', click() { app.quit() } }
]

if (process.env.NODE_ENV !== 'production') {
    const devTools = {
        label: 'Dev Tools',
        submenu: [
            {
                label: 'Toggle',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focused) {
                    if (focused !== undefined) {
                        focused.toggleDevTools()
                    }
                }
            },
            {
                role: 'reload'
            }
        ]
    }
    template.push(devTools)
}
app.on('ready', startApplication)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
app.on('activate', () => {
    if (win == null) {
        startApplication()
    }
})

ipcMain.on('url:validate', (event, item) => {
    console.log('Server received', item)
})
function startApplication() {
    createWindow()
    createTray()
    app.dock.hide()
}
function openSettings() {
    console.log('running')
    if (win == null) {
        createWindow()
    }
    win.show()
}
function createWindow() {
    win = new BrowserWindow({
        webPreferences: { nodeIntegration: true }
    })
    win.loadFile('index.html')
    win.hide()
    win.on('closed', () => {
        win = null
    })
}
function createTray() {
    tray = new Tray('assets/iconTemplate.png')
    const myTray = Menu.buildFromTemplate(template)
    tray.setContextMenu(myTray)
}