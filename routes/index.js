const route = require('express').Router()
const DevInfo = require('../model/devInfo')


route.get('/', async (req, res) => {
    // const devInfos = await DevInfo.find()
    // const { violation, description } = devInfos[0]
    // if (violation) {
    //     res.render('warning', {
    //         layout: 'layouts/warning-layout',
    //         title: 'Warning',
    //         description,
    //     })
    // } else {
    res.render('index', {
        layout: 'layouts/main-layout',
        title: 'Dashboard',
    })
    // }
})

route.get('/about', (req, res) => {
    res.render('about', {
        layout: 'layouts/main-layout',
        title: 'Halaman About'
    })
})


const accTypeRoute = require('./accType')
route.use('/account-type', accTypeRoute)

const parentAccRoute = require('./parentAcc')
route.use('/parent-account', parentAccRoute)

const childAccRoute = require('./childAcc')
route.use('/child-account', childAccRoute)

const journalRoute = require('./journal')
route.use('/journal', journalRoute)

const receiptJournalRoute = require('./receiptJournal')
route.use('/receipt-journal', receiptJournalRoute)

const disbursementJournalRoute = require('./disbursementJournal')
route.use('/disbursement-journal', disbursementJournalRoute)

const adjustmentJournalRoute = require('./adjustmentJournal')
route.use('/adjustment-journal', adjustmentJournalRoute)

const closingJournalRoute = require('./closingJournal')
route.use('/closing-journal', closingJournalRoute)

const openingBalanceRoute = require('./openingBalance')
route.use('/opening-balance', openingBalanceRoute)

const reportRoute = require('./report')
route.use('/report', reportRoute)





const contactRoute = require('./contact')
route.use('/contact', contactRoute)

module.exports = route