const { app, BrowserWindow, Menu, Tray, ipcMain } = require('electron')
const PowerSchoolAPI = require('powerschool-api')
const parser = require('./parser')
const path = require('path')
var jsonfile = require('jsonfile')

const configFile = path.join(__dirname, 'config.json')
const page = path.join(__dirname, 'index.html')
const iconLocation = path.join(__dirname, 'assets', 'IconTemplate.png')
let win = null
let tray = null
let api = null
const template = [
    {
        label: 'Grades', submenu: [
            { label: 'None', click() { openSettings() } }
        ]
    },
    { type: 'separator'},
    { label: 'Account', click() { openSettings() } },
    { label: 'Refresh', click() { loadConfig() }},
    { type: 'separator'},
    { label: 'Quit', click() { app.quit() } },
]

const passThrough = (fn) => (a) => {
    fn(a);    // process side-effects
    return a; // pass the data further
};

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

ipcMain.on('url:validate', (event, url) => {
    console.log('Server received', url)
    api = new PowerSchoolAPI(url)
    api.setup()
        .then(api => {
        saveData({'url': url})
        event.reply('url:success', 'Success')
    }).catch(err => {
        event.reply('url:failure', err)
        console.log(err)
    })
})
function saveData(values) {
    jsonfile.readFile(configFile)
        .then((data) => {
            for (val in values) {
                data[val] = values[val]
            }
            return data
        })
        .then((updatedData) => {
            jsonfile.writeFile(configFile, updatedData)
        }).then((success) => {
            return null
        }).catch (err => {
            console.log(err)
        })
}
ipcMain.on('login:validate', (event, data) => {
    api.login(data.username, data.password)
    .then(student => student.getStudentInfo())
        .then(passThrough(student => {
            saveData({ 'user': data.username, 'pass': data.password })
        }))
    .then(passThrough((student) => event.reply('login:success', 'Success')))
    .then(refreshPowerschool)
    .catch(err => {
        event.reply('login:failure', 'Invalid Username or Password')
    })
})

let refreshPowerschool = (studentInfo) => {
        parser.parseStudent(studentInfo)
        .then(parser.createMenu)
            .then(menu => {
            template.shift(1)
            template.unshift({ label: 'Grades', submenu: menu })
            updateTray()
        }).catch(err => {
            console.log('RefreshPowerschool ERR =>', err)
        })

}
const trayPosition = () => {
    const trayBounds = tray.getBounds()
    const windowBounds = win.getBounds()
    const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))
    const y = Math.round(trayBounds.y)
    return [x, y]
}
let loadConfig = () => {
    jsonfile.readFile(configFile, (err, data) => {
        if (data.user && data.pass && data.url) {
            api = new PowerSchoolAPI(data.url)
            api.setup()
                .then(() => api.login(data.user, data.pass))
                .then((student => student.getStudentInfo()))
                .then(refreshPowerschool)
            .catch(err => { console.log('Config err =>', err)})
        }
    })
}
function startApplication() {
    createWindow()
    tray = new Tray(iconLocation)
    loadConfig()
    updateTray()
    app.dock.hide()
}
function openSettings() {
    console.log('running')
    if (win == null) {
        createWindow()
    }
    win.show()
    win.setPosition(...trayPosition(), false)
    win.focus()
}
function createWindow() {
    win = new BrowserWindow({
        width: 500,
        height: 250,
        fullscreenable: false,
        frame: false,
        transparent: true,
        show: false,
        webPreferences: { nodeIntegration: true }
    })
    win.loadFile('index.html')
    win.on('closed', () => {
        win = null
    })
    // loses focus
    win.on('blur', () => {win.hide()})
}
function updateTray() {
    const myTray = Menu.buildFromTemplate(template)
    tray.setContextMenu(myTray)
}