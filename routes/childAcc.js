const childAccRoute = require('express').Router()
const Journal = require('../model/journal')
const ChildAcc = require('../model/childAcc')
const ParentAcc = require('../model/parentAcc')
const { body, validationResult, check } = require('express-validator')

// route halaman Akun
childAccRoute.get('/', async (req, res) => {
    const childAccs = await ChildAcc.find()
    const parentAccs = await ParentAcc.find()
    childAccs.sort((a,b)=> {
        let ab = a.accChildCode.split('-').join('')
        let bc = b.accChildCode.split('-').join('')
        return ab - bc
    })
    res.render('child-account', {
        layout: 'layouts/main-layout',
        title: 'Akun',
        childAccs,
        parentAccs,
        msg: req.flash('msg'),
        typeAlert: req.flash('typeAlert')
    })
})

// route halaman tambah data
childAccRoute.get('/add', async (req, res) => {
    const parentAccs = await ParentAcc.find()
    parentAccs.sort((a,b)=> {
        let ab = a.accCode.split('-').join('')
        let bc = b.accCode.split('-').join('')
        return ab - bc
    })
    res.render('child-account/add', {
        title: 'Tambah Data Akun',
        layout: 'layouts/main-layout',
        parentAccs
    })
})

// proses tambah data
childAccRoute.post('/', [
    body('accChildName').custom(async (value) => {
        const duplicate = await ChildAcc.findOne({ accChildName: value })
        if (duplicate) {
            throw new Error('Nama sudah digunakan!')
        }
        return true
    }),
    body('accChildCode').custom(async (value) => {
        const duplicate = await ChildAcc.findOne({ accChildCode: value })
        if (duplicate) {
            throw new Error('Nomor Akun sudah digunakan!')
        }
        return true
    }),
],
    async (req, res) => {
        const parentAccs = await ParentAcc.find()
        const errors = await validationResult(req)
        if (!errors.isEmpty()) {
            parentAccs.sort((a,b)=> {
                let ab = a.accCode.split('-').join('')
                let bc = b.accCode.split('-').join('')
                return ab - bc
            })
            res.render('child-account/add', {
                title: 'Tambah Data Akun',
                layout: 'layouts/main-layout',
                errors: errors.array(),
                parentAccs
            })
        } else {
            ChildAcc.insertMany(req.body, (error, result) => {
                req.flash('msg', 'Data berhasil ditambahkan!')
                req.flash('typeAlert', 'alert-success')
                res.redirect('/child-account')
            })
        }
    })

// prosses delete data
childAccRoute.delete('/', async (req, res) => {
    let accUsed = 0
    const journals = await Journal.find()
    await journals.forEach(journal => {
        let tes = journal.journalTrans.find(journ => journ.accChildId == req.body._id)
        // console.log(tes)
        if (tes) {
            accUsed++
        }
    });
    // const accUsed = await Journal.findOne({ parentAcc: req.body._id })
    if (!accUsed) {
        ChildAcc.deleteOne({ _id: req.body._id }).then((result) => {
            req.flash('msg', 'Data berhasil dihapus!')
            req.flash('typeAlert', 'alert-success')
            res.redirect('/child-account')
        })
        console.log('berhasil')
    } else {
        req.flash('msg', 'Gagal menghapus, sudah ada transaksi untuk akun ini!')
        req.flash('typeAlert', 'alert-danger')
        res.redirect('/child-account')
        console.log('gagal')
    }
})

// halaman edit data
childAccRoute.get('/edit/:accChildName', async (req, res) => {

    const childAcc = await ChildAcc.findOne({ accChildName: req.params.accChildName })
    const parentAccs = await ParentAcc.find()
    parentAccs.sort((a,b)=> {
        let ab = a.accCode.split('-').join('')
        let bc = b.accCode.split('-').join('')
        return ab - bc
    })
    res.render('child-account/edit', {
        title: 'Ubah Data Akun',
        layout: 'layouts/main-layout',
        childAcc,
        parentAccs
    })
})

childAccRoute.put('/', [
    body('accChildName').custom(async (value, { req }) => {
        const duplicate = await ChildAcc.findOne({ accChildName: value })
        if (value !== req.body.oldAccChildName && duplicate) {
            throw new Error('Nama sudah digunakan!')
        }
        return true
    }),
    body('accChildCode').custom(async (value, { req }) => {
        const duplicate = await ChildAcc.findOne({ accChildCode: value })
        if (value !== req.body.oldAccChildCode && duplicate) {
            throw new Error('Nomor akun sudah digunakan!')
        }
        return true
    })
],
    async (req, res) => {
        const parentAccs = await ParentAcc.find()
        const errors = await validationResult(req)
        if (!errors.isEmpty()) {
            res.render('child-account/edit', {
                title: 'Ubah Data Akun',
                layout: 'layouts/main-layout',
                errors: errors.array(),
                childAcc: req.body,
                parentAccs
            })
        } else {
            ChildAcc.updateOne(
                { _id: req.body._id },
                {
                    $set: {
                        accChildName: req.body.accChildName,
                        parentAcc: req.body.parentAcc,
                        accChildCode: req.body.accChildCode,
                        accChildBalance: req.body.accChildBalance
                    },
                }
            ).then((result) => {
                req.flash('msg', 'Data berhasil diperbaharui!')
                req.flash('typeAlert', 'alert-success')
                res.redirect('/child-account')
            })
        }
    })

// childAccRoute.get('/:nama', async (req, res) => {
//     const contact = await Contact.findOne({ nama: req.params.nama })
//     res.render('detail', {
//         layout: 'layouts/main-layout',
//         title: 'Halaman Detail Contact',
//         contact
//     })
// })


module.exports = childAccRoute