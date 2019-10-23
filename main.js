const { app, BrowserWindow, Menu, Tray, ipcMain } = require('electron')

require('electron-reload')(__dirname, {
    electron: require(`${__dirname}/node_modules/electron`)
});

const PowerSchoolAPI = require('powerschool-api')
const clipboard = require('clipboardy')
const util = require('util')
let win = null
let tray = null
let api = null
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

ipcMain.on('url:validate', (event, url) => {
    console.log('Server received', url)
    api = new PowerSchoolAPI(url)
    api.setup()
    .then(api => {
        event.reply('url:success', 'Success')
    }).catch(err => {
        event.reply('url:failure', 'The URL could not be found')
        console.log(err)
    })
})

ipcMain.on('login:validate', (event, data) => {
    console.log(data.username, data.password)
    api.login(data.username, data.password).then((rawStudent) => {
        return rawStudent.api
    }).then(data => {
        // https://aydenp.github.io/PowerSchool-API/PowerSchoolReportingTerm.html
        console.log(data)
        // let { student, cache } = data
        // console
        // let info = await student
        // template.push(...[{ label: info.firstName }, {label: `GPA:${info.currentGPA}`}])
        // // clipboard.writeSync(util.inspect(student))
        // clipboard.writeSync(cache)
        // for (term of student.reportingTerms) {
        //     // console.log(term.title)
        //     if (term.id == 8802) {
        //         // console.log(clipboard.writeSync(util.inspect(term)))
        //     }
        //     let grades = term.getFinalGrades()
        //     for (grade of grades) {
        //         let course = grade.getCourse()
        //         // console.log(course.title, grade.percentage)
        //     }
        // }
        createTray()

    }).catch(err => {
        console.log(err)
        event.reply('login:failure', 'Invalid Username or Password')
    })
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
        width: 500,
        height: 250,
        maximizable: false,
        show: false,
        webPreferences: { nodeIntegration: true }
    })
    win.loadFile('index.html')
    win.on('closed', () => {
        win = null
    })
}
function createTray() {
    tray = new Tray('assets/iconTemplate.png')
    const myTray = Menu.buildFromTemplate(template)
    tray.setContextMenu(myTray)
}