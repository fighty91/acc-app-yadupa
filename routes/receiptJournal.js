const receiptJournalRoute = require('express').Router()
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

const dateTransactionHandler = (date) => {
    y = date.getFullYear()
    m = String(date.getMonth() + 1)
    d = String(date.getDate())
    if (m.length === 1) { m = '0' + m }
    if (d.length === 1) { d = '0' + d }
    const value = `${y}-${m}-${d}`
    return value
}

const currencyNumberHandler = (value) => {
    let dataNumber = Number(value)

    // pikirkan cara membuat desimal menjadi 2 angka di belakang koma
    let decimal = 0
    let decDetect = dataNumber.toString().split('.')
    if (decDetect.length === 2) {
        decimal = decDetect[1]
        dataNumber = Number(decDetect[0])
    }

    let reverse = dataNumber.toString().split('').reverse().join('');
    let ribuan = reverse.match(/\d{1,3}/g);
    ribuan = ribuan.join(',').split('').reverse().join('');

    ribuan == 0 ?
        value = '' :
        decimal === 0 ?
            value = ribuan :
            value = `${ribuan}.${decimal}`

    return ribuan
}

// route halaman Index
receiptJournalRoute.get('/', async (req, res) => {
    const journals = await Journal.find({ ref: "rj"})
    const childAccs = await ChildAcc.find()
    res.render('receipt-journal', {
        layout: 'layouts/main-layout',
        title: 'Jurnal Penerimaan',
        childAccs,
        journals,
        msg: req.flash('msg')
    })
})

// route halaman tambah data
receiptJournalRoute.get('/add', async (req, res) => {
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
    
    res.render('receipt-journal/add', {
        title: 'Transaksi Jurnal Penerimaan',
        layout: 'layouts/main-layout',
        parentAccs,
        childAccs,
        dateNow
    })
})

// proses tambah data
receiptJournalRoute.post('/', [
    body('creditAcc').custom(async (value, { req }) => {
        let creditTotal = 0
        await value.forEach((credit, i) => {
            creditTotal += +credit
        })
        if (creditTotal === 0) {
            throw new Error('Nilai belum dimasukkan!')
        }
    })
],
    async (req, res) => {
        const journals = await Journal.find()
        const childAccs = await ChildAcc.find()
        const parentAccs = await ParentAcc.find()
        const errors = await validationResult(req)
        if (!errors.isEmpty()) {
            res.render('receipt-journal/add', {
                title: 'Transaksi Jurnal Penerimaan',
                layout: 'layouts/main-layout',
                errors: errors.array(),
                journals, dateNow, childAccs, parentAccs
            })
        } else {
            const { date, cashBank, description, account, creditAcc, information } = req.body
            
            let transNumber = 100001
            if (journals.length > 0) {
                let i = journals.length - 1
                if (journals[i].transNumber >= 100001) {
                    transNumber = journals[i].transNumber + 1
                }
            }

            let data = { date, description, ref: 'rj', transNumber, journalTrans: [] }

            let cashBankValue = 0
            await account.forEach((accChildId, i) => {
                const credit = +creditAcc[i]
                if (accChildId !== '') {
                    if (credit > 0) {
                        cashBankValue += credit
                    }
                }
            })
            let cashBankTrans = {
                accChildId: cashBank,
                debet: cashBankValue,
                credit: 0
            }
            await data.journalTrans.push(cashBankTrans)

            await account.forEach((accChildId, i) => {
                const credit = +creditAcc[i]
                const info = information[i]
                if (accChildId !== '') {
                    if (credit > 0) {
                        let temp = {
                            accChildId,
                            debet: 0,
                            credit,
                            info
                        }
                        data.journalTrans.push(temp)
                    }
                }
            })

            await Journal.insertMany(data, (error, result) => {
                // req.flash('msg', 'Data berhasil ditambahkan!')
                res.redirect(`/receipt-journal/r/${transNumber}`)
            })
        }
    })


// prosses delete data
receiptJournalRoute.delete('/', (req, res) => {
    Journal.deleteOne({ _id: req.body._id }).then((result) => {
        req.flash('msg', 'Transaksi berhasil dihapus!')
        res.redirect('/receipt-journal')
    })
})

// halaman edit data
receiptJournalRoute.get('/edit/:id', async (req, res) => {
    const journal = await Journal.findOne({ _id: req.params.id })
    const childAccs = await ChildAcc.find()
    const parentAccs = await ParentAcc.find()

    await childAccs.sort((a, b)=>{
        let ab = +a.accChildCode.split('-').join('')
        let cd = +b.accChildCode.split('-').join('')
        return ab - cd
    })
    await parentAccs.sort((a, b)=>{
        let ab = +a.accCode.split('-').join('')
        let cd = +b.accCode.split('-').join('')
        return ab - cd
    })

    const { date } = journal
    
    const dateTrans = await dateTransactionHandler(date)
    
    res.render('receipt-journal/edit', {
        title: 'Ubah Transaksi Penerimaan',
        layout: 'layouts/main-layout',
        childAccs,
        journal,
        parentAccs,
        dateTrans,
    })
})

receiptJournalRoute.put('/', [
    body('creditAcc').custom(async (value, { req }) => {
        let creditTotal = 0
        await value.forEach((credit, i) => {
            creditTotal += +credit
        })
        if (creditTotal === 0) {
            throw new Error('Nilai belum dimasukkan!')
        }
    })
],
    async (req, res) => {
        const journals = await Journal.find()
        const childAccs = await ChildAcc.find()
        const parentAccs = await ParentAcc.find()
        const errors = await validationResult(req)
        if (!errors.isEmpty()) {
            res.render('receipt-journal/edit', {
                title: 'Ubah Transaksi Penerimaan',
                layout: 'layouts/main-layout',
                errors: errors.array(),
                journals, dateNow, childAccs, parentAccs
            })
        } else {
            const { date, cashBank, description, account, creditAcc, information, _id} = req.body
            // data akun transaksi jurnal
            let journalTrans = []
            let cashBankValue = 0
            await account.forEach((accChildId, i) => {
                const credit = +creditAcc[i]
                if (accChildId !== '') {
                    if (credit > 0) {
                        cashBankValue += credit
                    }
                }
            })
            let cashBankTrans = {
                accChildId: cashBank,
                debet: cashBankValue,
                credit: 0
            }
            await journalTrans.push(cashBankTrans)

            await account.forEach((accChildId, i) => {
                const credit = +creditAcc[i]
                const info = information[i]
                if (accChildId !== '') {
                    if (credit > 0) {
                        let temp = {
                            accChildId,
                            debet: 0,
                            credit,
                            info
                        }
                        journalTrans.push(temp)
                    }
                }
            })

            await Journal.updateOne(
                { _id },
                {
                    $set: {
                        date,
                        description,
                        journalTrans
                    },
                }
            ).then((result) => {
                req.flash('msg', 'Transaksi berhasil diperbaharui!')
                res.redirect(`/receipt-journal/${_id}`)
            })
        }
    })

receiptJournalRoute.get('/:_id', async (req, res) => {
    const journals = await Journal.findOne({ _id: req.params._id })
    const childAccs = await ChildAcc.find()
    res.render('receipt-journal/detail', {
        layout: 'layouts/main-layout',
        title: 'Detail Transaksi Jurnal Penerimaan',
        journals,
        childAccs
    })
})

receiptJournalRoute.get('/r/:transNumber', async (req, res) => {
    const journal = await Journal.findOne({ transNumber: req.params.transNumber })
    const id = journal._id
    res.redirect(`/receipt-journal/${id}`)
})


module.exports = receiptJournalRoute