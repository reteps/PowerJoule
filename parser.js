function parseStudent(student) {
    return new Promise((resolve, reject) => {
        let grades = student.finalGrades.filter(val => val.percentage != 0)
        console.log('WE got far')

        termStorage = {}
        for (finalGrade of grades) {
            let term = finalGrade.getReportingTerm()
            let course = finalGrade.getCourse()
            let assignments = course.getAssignments()
            let courseLabel = `${finalGrade.percentage * 100}% - ${course.title}`

            if (!(term.title in termStorage)) {
                termStorage[term.title] = {}
            }
            if (!(courseLabel in termStorage[term.title])) {
                termStorage[term.title][courseLabel] = []
            }

            for (assignment of assignments) {
                let asmtScore = assignment.getScore()
                let grade = asmtScore.score
                let percent = asmtScore.percentage
                let totalPts = Math.round(grade / percent)
                let prettyPercent = Math.round(percent * 10000) / 100
                let assignmentLabel

                if (grade == '--') {
                    continue
                }
                if (percent == null) {
                    // Extracredit
                    assignmentLabel = `[${grade}/0] - ${assignment.name}`
                } else {
                    assignmentLabel = `[${prettyPercent}%] [${grade}/${totalPts}] - ${assignment.name}`
                }

                termStorage[term.title][courseLabel].push(assignmentLabel)
            }
        }
        console.log('WE got super far')
        resolve(termStorage)
    })
}
function createMenu(parsedStudent) {
    return new Promise((resolve, reject) => {

        menu = []
        for (let [term, course] of Object.entries(termStorage)) {
            termCourses = []
            for (let [key, value] of Object.entries(course)) {
                termCourses.push({
                    label: key,
                    submenu: value.map(asmt => { return { 'label': asmt } })
                })
            }
            menu.push({
                label: term,
                submenu: termCourses
            })
        }
        console.log('WE got super duper far')
        resolve(menu)
    })
}
module.exports = { parseStudent, createMenu }