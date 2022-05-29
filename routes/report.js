const reportRoute = require('express').Router()
const ChildAcc = require('../model/childAcc')
const Journal = require('../model/journal')
const ParentAcc = require('../model/parentAcc')
const AccType = require('../model/accType')
// const { body, validationResult, check } = require('express-validator')

const dateHandling = () => {
    n = new Date()
    y = n.getFullYear()
    m = String(n.getMonth() + 1)
    d = String(n.getDate())
    if (m.length === 1) { m = '0' + m }
    if (d.length === 1) { d = '0' + d }
    const value = `${y}-${m}-${d}`
    return value
}
const dateNow = dateHandling()

// route halaman Buku Besar
reportRoute.get('/ledger', async (req, res) => {
    const childAccs = await ChildAcc.find()
    const journals = await Journal.find()

    await childAccs.sort((a, b) => {
        const ab = +a.accChildCode.split('-').join('')
        const cd = +b.accChildCode.split('-').join('')
        return ab - cd
    })

    res.render('report/ledger', {
        layout: 'layouts/main-layout',
        title: 'Buku Besar',
        childAccs,
        journals,
        msg: req.flash('msg')
    })
})

// route halaman Neraca Saldo
reportRoute.get('/trial-balance', async (req, res) => {
    const childAccs = await ChildAcc.find()
    const journals = await Journal.find()

    await childAccs.sort((a, b) => {
        const ab = +a.accChildCode.split('-').join('')
        const cd = +b.accChildCode.split('-').join('')
        return ab - cd
    })

    res.render('report/trial-balance', {
        layout: 'layouts/main-layout',
        title: 'Neraca Saldo',
        childAccs,
        journals,
        msg: req.flash('msg')
    })
})

// route halaman Neraca Lajur
reportRoute.get('/work-sheet', async (req, res) => {
    const accTypes = await AccType.find()
    const parentAccs = await ParentAcc.find()
    const childAccs = await ChildAcc.find()
    const journals = await Journal.find()
    res.render('report/work-sheet', {
        layout: 'layouts/main-layout-2',
        title: 'Neraca Lajur',
        accTypes,
        parentAccs,
        childAccs,
        journals,
        msg: req.flash('msg')
    })
})

const profitLossRoute = require('./profitLoss')
reportRoute.use('/profit-loss', profitLossRoute)

const equityChangeRoute = require('./equityChange')
reportRoute.use('/equity-change', equityChangeRoute)

const balanceSheet = require('./balanceSheet')
reportRoute.use('/balance-sheet', balanceSheet)

reportRoute.get('/:nama', async (req, res) => {
    const contact = await Contact.findOne({ nama: req.params.nama })
    res.render('detail', {
        layout: 'layouts/main-layout',
        title: 'Halaman Detail Contact',
        contact
    })
})

module.exports = reportRoute