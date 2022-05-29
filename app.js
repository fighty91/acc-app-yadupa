const express = require('express')
const app = express()
const port = 3000

require('./utils/db')

// const Contact = require('./model/contact')
// const { body, validationResult, check } = require('express-validator')

const ip = require('ip')
const expressLayouts = require('express-ejs-layouts')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const flash = require('connect-flash')
const methodOverride = require('method-override')


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.set('view engine', 'ejs')
app.use(expressLayouts)
app.use(methodOverride('_method'))

// konfigurasi flash
app.use(cookieParser('secret'))
app.use(session({
    cookie: { maxAge: 6000 },
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
}))
app.use(flash())

const routes = require('./routes')
app.use(routes)


app.use((req, res) => {
    res.status(404)
    res.send('<h1>404</h1>')
})

app.listen(port, () => {
    console.log(`App is listening on http://localhost:${port}`)
    console.log(`or http://${ip.address()}:${port}`)
})