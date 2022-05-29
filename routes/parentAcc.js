const parentAccRoute = require('express').Router()
const ParentAcc = require('../model/parentAcc')
const AccType = require('../model/accType')
const ChildAcc = require('../model/childAcc')
const { body, validationResult, check } = require('express-validator')

// route halaman Akun Induk
parentAccRoute.get('/', async (req, res) => {
    const parentAccs = await ParentAcc.find()
    const accTypes = await AccType.find()
    parentAccs.sort((a,b)=> {
        let ab = a.accCode.split('-').join('')
        let bc = b.accCode.split('-').join('')
        return ab - bc
    })
    res.render('parent-account', {
        layout: 'layouts/main-layout',
        title: 'Akun Induk',
        parentAccs,
        accTypes,
        msg: req.flash('msg'),
        typeAlert: req.flash('typeAlert')
    })
})

// route halaman tambah data
parentAccRoute.get('/add', async (req, res) => {
    const accTypes = await AccType.find()
    res.render('parent-account/add', {
        title: 'Tambah Data Akun Induk',
        layout: 'layouts/main-layout',
        accTypes
    })
})

// proses tambah data
parentAccRoute.post('/', [
    body('accName').custom(async (value) => {
        const duplicate = await ParentAcc.findOne({ accName: value })
        if (duplicate) {
            throw new Error('Nama sudah digunakan!')
        }
        return true
    }),
    body('accCode').custom(async (value) => {
        const duplicate = await ParentAcc.findOne({ accCode: value })
        if (duplicate) {
            throw new Error('Nomor akun sudah digunakan!')
        }
        return true
    }),
],
    async (req, res) => {
        const accTypes = await AccType.find()
        const errors = await validationResult(req)
        if (!errors.isEmpty()) {
            res.render('parent-account/add', {
                title: 'Tambah Data Akun Induk',
                layout: 'layouts/main-layout',
                errors: errors.array(),
                accTypes
            })
        } else {
            ParentAcc.insertMany(req.body, (error, result) => {
                req.flash('msg', 'Data berhasil ditambahkan!')
                req.flash('typeAlert', 'alert-success')
                res.redirect('/parent-account')
            })
        }
    })

// prosses delete data
parentAccRoute.delete('/', async (req, res) => {
    const accUsed = await ChildAcc.findOne({ parentAcc: req.body._id })
    if (!accUsed) {
        ParentAcc.deleteOne({ _id: req.body._id }).then((result) => {
            req.flash('msg', 'Data berhasil dihapus!')
            req.flash('typeAlert', 'alert-success')
            res.redirect('/parent-account')
        })
    } else {
        req.flash('msg', 'Gagal menghapus, akun induk telah digunakan pada akun anak!')
        req.flash('typeAlert', 'alert-danger')
        res.redirect('/parent-account')
    }
})

// // halaman edit data
parentAccRoute.get('/edit/:accName', async (req, res) => {
    const parentAcc = await ParentAcc.findOne({ accName: req.params.accName })
    const accTypes = await AccType.find()
    res.render('parent-account/edit', {
        title: 'Ubah Data Akun Induk',
        layout: 'layouts/main-layout',
        parentAcc,
        accTypes
    })
})

parentAccRoute.put('/', [
    body('accName').custom(async (value, { req }) => {
        const duplicate = await ParentAcc.findOne({ accName: value })
        if (value !== req.body.oldAccName && duplicate) {
            throw new Error('Nama sudah digunakan!')
        }
        return true
    }),
    body('accCode').custom(async (value, { req }) => {
        const duplicate = await ParentAcc.findOne({ accCode: value })
        if (value !== req.body.oldAccCode && duplicate) {
            throw new Error('Nomor akun sudah digunakan!')
        }
        return true
    })
],
    async (req, res) => {
        const accTypes = await AccType.find()
        const errors = await validationResult(req)
        if (!errors.isEmpty()) {
            res.render('parent-account/edit', {
                title: 'Ubah Data Akun Induk',
                layout: 'layouts/main-layout',
                errors: errors.array(),
                parentAcc: req.body,
                accTypes
            })
        } else {
            ParentAcc.updateOne(
                { _id: req.body._id },
                {
                    $set: {
                        accName: req.body.accName,
                        accCode: req.body.accCode,
                        accBalance: req.body.accBalance,
                        accType: req.body.accType
                    },
                }
            ).then((result) => {
                req.flash('msg', 'Data berhasil diperbaharui!')
                req.flash('typeAlert', 'alert-success')
                res.redirect('/parent-account')
            })
        }
    })

// parentAccRoute.get('/:nama', async (req, res) => {
//     const contact = await Contact.findOne({ nama: req.params.nama })
//     res.render('detail', {
//         layout: 'layouts/main-layout',
//         title: 'Halaman Detail Contact',
//         contact
//     })
// })


module.exports = parentAccRoute