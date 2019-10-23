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
        return rawStudent.getStudentInfo()
    }).then(student => {
        // https://aydenp.github.io/PowerSchool-API/PowerSchoolReportingTerm.html
        termID = {}
        // for (term of student.reportingTerms) {
        //     termID.push({id: term.id, title: term.title})
        // }
        console.log('#finakGrades', student.finalGrades.length)
        let grades = student.finalGrades.filter(val =>  val.percentage != 0)
        console.log('#grades', grades.length)
        menu = []
        terms = {}
        for (finalGrade of grades) {
            let term = finalGrade.getReportingTerm()

            if (!(term.title in terms)) {
                terms[term.title] = {'label': term.title, submenu: []}
            }
            console.log(terms[term.title])
            let course = finalGrade.getCourse()

            terms[term.title].submenu.push({
                label: `${course.title} - ${finalGrade.percentage}`,
             submenu: []
            })

            let assignments = course.getAssignments()
            for (assignment of assignments) {
                let grade = assignment.getScore().score
                console.log(assignment.name, grade)
            }

            console.log(term.title, finalGrade.percentage, course.title)
        }
        console.log(terms)
        template.push(terms.values())
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