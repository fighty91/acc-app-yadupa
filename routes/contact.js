const contactRoute = require('express').Router()
const Contact = require('../model/contact')
const { body, validationResult, check } = require('express-validator')

// route halaman contact
contactRoute.get('/', async (req, res) => {
    // Contact.find().then((contact) =>{
    //     res.send(contact)
    // })
    const contacts = await Contact.find()
    res.render('contact', {
        layout: 'layouts/main-layout',
        title: 'Halaman Contact',
        contacts,
        msg: req.flash('msg')
    })
})

// route halaman tambah data
contactRoute.get('/add', (req, res) => {
    res.render('add-contact', {
        title: 'Form Tambah Data Contact',
        layout: 'layouts/main-layout'
    })
})

// proses tambah data
contactRoute.post('/', [
    body('nama').custom(async (value) => {
        const duplikat = await Contact.findOne({ nama: value })
        if (duplikat) {
            throw new Error('Nama contact sudah digunakan!')
        }
        return true
    }),
    check('email', 'Email tidak valid').isEmail(),
    check('nohp', 'Nomor hp tidak valid').isMobilePhone('id-ID')
],
    (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.render('add-contact', {
                title: 'Form Tambah Data Contact',
                layout: 'layouts/main-layout',
                errors: errors.array()
            })
        } else {
            Contact.insertMany(req.body, (error, result) => {
                req.flash('msg', 'Data berhasil ditambahkan!')
                res.redirect('/contact')
            })
        }
    })

// prosses delete data
contactRoute.delete('/', (req, res) => {
    Contact.deleteOne({ nama: req.body.nama }).then((result) => {
        req.flash('msg', 'Data kontak berhasil dihapus!')
        res.redirect('/contact')
    })
})

// halaman edit data
contactRoute.get('/edit/:nama', async (req, res) => {
    const contact = await Contact.findOne({ nama: req.params.nama })
    res.render('edit-contact', {
        title: 'Form Ubah Data Contact',
        layout: 'layouts/main-layout',
        contact
    })
})

contactRoute.put('/', [
    body('nama').custom(async (value, { req }) => {
        const duplikat = await Contact.findOne({ nama: value })
        if (value !== req.body.oldNama && duplikat) {
            throw new Error('Nama contact sudah digunakan!')
        }
        return true
    }),
    check('email', 'Email tidak valid').isEmail(),
    check('nohp', 'Nomor hp tidak valid').isMobilePhone('id-ID')
],
    (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.render('edit-contact', {
                title: 'Form Ubah Data Contact',
                layout: 'layouts/main-layout',
                errors: errors.array(),
                contact: req.body
            })
        } else {
            Contact.updateOne(
                { _id: req.body._id },
                {
                    $set: {
                        nama: req.body.nama,
                        email: req.body.email,
                        nohp: req.body.nohp
                    },
                }
            ).then((result) => {
                req.flash('msg', 'Data berhasil diperbaharui!')
                res.redirect('/contact')
            })
        }
    })

contactRoute.get('/:nama', async (req, res) => {
    const contact = await Contact.findOne({ nama: req.params.nama })
    res.render('detail', {
        layout: 'layouts/main-layout',
        title: 'Halaman Detail Contact',
        contact
    })
})

contactRoute.get('/2/:nama', async (req, res) => {
    const contact = await Contact.findOne({ nama: req.params.nama })
    res.render('detail2', {
        layout: 'layouts/main-layout',
        title: 'Halaman Detail Contact',
        contact
    })
})

module.exports = contactRoute