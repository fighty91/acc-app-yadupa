const accTypeRoute = require('express').Router()
const AccType = require('../model/accType')
const ParentAcc = require('../model/parentAcc')
const { body, validationResult, check } = require('express-validator')

// route halaman tipe akun
accTypeRoute.get('/', async (req, res) => {
    const accTypes = await AccType.find()
    res.render('account-type', {
        layout: 'layouts/main-layout',
        title: 'Tipe Akun',
        accTypes,
        msg: req.flash('msg'),
        typeAlert: req.flash('typeAlert')
    })
})

// route halaman tambah data
accTypeRoute.get('/add', (req, res) => {
    res.render('account-type/add', {
        title: 'Tambah Data Tipe Akun',
        layout: 'layouts/main-layout'
    })
})

// proses tambah data
accTypeRoute.post('/', [
    body('typeName').custom(async (value) => {
        const duplicate = await AccType.findOne({ typeName: value })
        if (duplicate) {
            throw new Error('Nama sudah digunakan!')
        }
        return true
    }),
],
    (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.render('account-type/add', {
                title: 'Tambah Data Tipe Akun',
                layout: 'layouts/main-layout',
                errors: errors.array()
            })
        } else {
            AccType.insertMany(req.body, (error, result) => {
                req.flash('msg', 'Data berhasil ditambahkan!')
                req.flash('typeAlert', 'alert-success')
                res.redirect('/account-type')
            })
        }
    })

// proses delete data
accTypeRoute.delete('/', async (req, res) => {
    const typeUsed = await ParentAcc.findOne({ accType: req.body._id })
    if (!typeUsed) {
        AccType.deleteOne({ _id: req.body._id }).then((result) => {
            req.flash('msg', 'Data berhasil dihapus!')
            req.flash('typeAlert', 'alert-success')
            res.redirect('/account-type')
        })
    } else {
        req.flash('msg', 'Gagal menghapus, data telah digunakan pada akun')
        req.flash('typeAlert', 'alert-danger')
        res.redirect('/account-type')
    }

})

// halaman edit data
accTypeRoute.get('/edit/:typeName', async (req, res) => {
    const accType = await AccType.findOne({ typeName: req.params.typeName })
    res.render('account-type/edit', {
        title: 'Ubah Data Tipe Akun',
        layout: 'layouts/main-layout',
        accType
    })
})

accTypeRoute.put('/', [
    body('typeName').custom(async (value, { req }) => {
        const duplicate = await AccType.findOne({ typeName: value })
        if (value !== req.body.oldTypeName && duplicate) {
            throw new Error('Nama sudah digunakan!')
        }
        return true
    })
],
    (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.render('account-type/edit', {
                title: 'Ubah Data Tipe Akun',
                layout: 'layouts/main-layout',
                errors: errors.array(),
                accType: req.body
            })
        } else {
            AccType.updateOne(
                { _id: req.body._id },
                {
                    $set: {
                        typeName: req.body.typeName,
                        fState: req.body.fState
                    },
                }
            ).then((result) => {
                req.flash('msg', 'Data berhasil diperbaharui!')
                req.flash('typeAlert', 'alert-success')
                res.redirect('/account-type')
            })
        }
    })

// accTypeRoute.get('/:nama', async (req, res) => {
//     const contact = await Contact.findOne({ nama: req.params.nama })
//     res.render('detail', {
//         layout: 'layouts/main-layout',
//         title: 'Halaman Detail Contact',
//         contact
//     })
// })


module.exports = accTypeRoute