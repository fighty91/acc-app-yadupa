const adjustmentJournalRoute = require('express').Router()
const Journal = require('../model/journal')
const ParentAcc = require('../model/parentAcc')
const ChildAcc = require('../model/childAcc')
const { body, validationResult, check } = require('express-validator')

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

// route halaman Akun
adjustmentJournalRoute.get('/', async (req, res) => {
    const journals = await Journal.find()
    const childAccs = await ChildAcc.find()

    res.render('adjustment-journal', {
        layout: 'layouts/main-layout',
        title: 'Jurnal Penyesuaian',
        childAccs,
        journals,
        msg: req.flash('msg')
    })
})

// route halaman tambah data
adjustmentJournalRoute.get('/add', async (req, res) => {
    const journals = await Journal.find()
    const parentAccs = await ParentAcc.find()
    const childAccs = await ChildAcc.find()

    childAccs.sort((a, b)=>{
        let ab = +a.accChildCode.split('-').join('')
        let cd = +b.accChildCode.split('-').join('')
        return ab - cd
    })
    parentAccs.sort((a, b)=>{
        let ab = +a.accCode.split('-').join('')
        let cd = +b.accCode.split('-').join('')
        return ab - cd
    })
    
    res.render('adjustment-journal/add', {
        title: 'Transaksi Jurnal Penyesuaian',
        layout: 'layouts/main-layout',
        journals,
        parentAccs,
        childAccs,
        dateNow
    })
})

// proses tambah data
adjustmentJournalRoute.post('/', [
    body('account').custom(async (value, { req }) => {
        let debetTotal = 0
        let creditTotal = 0
        value.forEach((acc, i) => {
            debetTotal += +req.body.debetAcc[i]
            creditTotal += +req.body.creditAcc[i]
        })
        if (debetTotal != creditTotal) {
            throw new Error('Total debet kredit tidak imbang')
        }
    })
],
    async (req, res) => {
        const journals = await Journal.find()
        const childAccs = await ChildAcc.find()
        const parentAccs = await ParentAcc.find()
        const errors = await validationResult(req)
        if (!errors.isEmpty()) {
            res.render('adjustment-journal/add', {
                title: 'Transaksi Jurnal Penyesuaian',
                layout: 'layouts/main-layout',
                errors: errors.array(),
                journals, dateNow, childAccs, parentAccs
            })
            console.log(errors)
        } else {
            const { date, description, account, debetAcc, creditAcc } = req.body

            let transNumber = 100001
            if (journals.length > 0) {
                let i = journals.length - 1
                if (journals[i].transNumber >= 100001) {
                    transNumber = journals[i].transNumber + 1
                }
            }

            let data = { date, description, ref: 'aj', transNumber, journalTrans: [] }

            await account.forEach((accChildId, i) => {
                const debet = +debetAcc[i]
                const credit = +creditAcc[i]

                if (accChildId !== '') {
                    if (debet > 0 || credit > 0) {
                        let temp = {
                            accChildId,
                            debet,
                            credit
                        }
                        data.journalTrans.push(temp)
                    }
                }
            })

            await Journal.insertMany(data, (error, result) => {
                // req.flash('msg', 'Data berhasil ditambahkan!')
                res.redirect(`/adjustment-journal/r/${transNumber}`)
            })

        }

    })

// prosses delete data
adjustmentJournalRoute.delete('/', (req, res) => {
    Journal.deleteOne({ _id: req.body._id }).then((result) => {
        req.flash('msg', 'Transaksi berhasil dihapus!')
        res.redirect('/adjustment-journal')
    })
})

// // halaman edit data
// adjustmentJournalRoute.get('/edit/:accChildName', async (req, res) => {
//     const childAcc = await ChildAcc.findOne({ accChildName: req.params.accChildName })
//     const journals = await Journal.find()
//     res.render('journal/edit', {
//         title: 'Ubah Data Akun',
//         layout: 'layouts/main-layout',
//         childAcc,
//         journals
//     })
// })

// adjustmentJournalRoute.put('/', [
//     body('accChildName').custom(async (value, { req }) => {
//         const duplicate = await ChildAcc.findOne({ accChildName: value })
//         if (value !== req.body.oldAccChildName && duplicate) {
//             throw new Error('Nama sudah digunakan!')
//         }
//         return true
//     }),
//     body('accChildCode').custom(async (value, { req }) => {
//         const duplicate = await ChildAcc.findOne({ accChildCode: value })
//         if (value !== req.body.oldAccChildCode && duplicate) {
//             throw new Error('Nomor akun sudah digunakan!')
//         }
//         return true
//     })
// ],
//     async (req, res) => {
//         const journals = await Journal.find()
//         const errors = await validationResult(req)
//         if (!errors.isEmpty()) {
//             res.render('journal/edit', {
//                 title: 'Ubah Data Akun',
//                 layout: 'layouts/main-layout',
//                 errors: errors.array(),
//                 childAcc: req.body,
//                 journals
//             })
//         } else {
//             ChildAcc.updateOne(
//                 { _id: req.body._id },
//                 {
//                     $set: {
//                         accChildName: req.body.accChildName,
//                         journal: req.body.journal,
//                         accChildCode: req.body.accChildCode,
//                         accChildBalance: req.body.accChildBalance
//                     },
//                 }
//             ).then((result) => {
//                 req.flash('msg', 'Data berhasil diperbaharui!')
//                 res.redirect('/journal')
//             })
//         }
//     })

adjustmentJournalRoute.get('/:_id', async (req, res) => {
    const journals = await Journal.findOne({ _id: req.params._id })
    const childAccs = await ChildAcc.find()
    res.render('adjustment-journal/detail', {
        layout: 'layouts/main-layout',
        title: 'Detail Transaksi Jurnal Penyesuaian',
        journals,
        childAccs
    })
})

adjustmentJournalRoute.get('/r/:transNumber', async (req, res) => {
    const journal = await Journal.findOne({ transNumber: req.params.transNumber })
    const id = journal._id
    res.redirect(`/adjustment-journal/${id}`)
})





module.exports = adjustmentJournalRoute