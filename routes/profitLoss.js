const profitLossRoute = require('express').Router()
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

const accountHandler = async (accTypes, parentAccs, childAccs, journalPeriode, journals) => {
    // filter type akun
    const typeId = await accTypes.map(e => e._id)

    // filter akun parent
    let parentId = []
    await typeId.forEach(e => {
        parentAccs.find(a => {
            if (a.accType == e) { parentId.push(a._id) }
        })
    })

    // filter akun pendapatan pengeluaran
    let accounts = []
    await parentId.forEach(e => {
        childAccs.find(a => {
            if (a.parentAcc == e) { accounts.push(a) }
        })
    })

    
    // inisiasi akun
    let accs = []
    await accounts.forEach(async a => {
        let temp = {}
        let i = 0
        let debet = 0
        let credit = 0
        await journalPeriode.forEach(j => {
            j.journalTrans.forEach(e => { 
                if (e.accChildId == a._id) {
                    // console.log(a)
                     i++
                     debet += e.debet
                     credit += e.credit
                } 
            })
        })
        if (i > 0) { 
            temp.id = a._id
            temp.name = a.accChildName
            temp.parent = a.parentAcc
            temp.code = a.accChildCode
            temp.debet = debet
            temp.credit = credit
            accs.push(temp)
        }
    })
    

    // filter daftar tahun transaksi - ambil tahun saja untuk datenya
    let years = []
    const transYear = await journals.map(e => e.date.getFullYear())
    for (let i = 0; i < transYear.length; i++){
        if(i===0){
            years.push(transYear[i])
        } else {
            let temp = 0
            for(let a = 0; a < i; a++){
                if(transYear[a] === transYear[i]){temp++}
            }
            if(temp===0){years.push(transYear[i])}
        }
    }

    let yearMonths = []
    const transYearMonth = await journals.map(e => {
        let yearTemp = e.date.getFullYear()
        let monthTemp = String(e.date.getMonth() + 1)

        monthTemp = monthTemp.length === 1 ? '0'+monthTemp: monthTemp
        const yearMonthTemp = `${yearTemp}-${monthTemp}`
        return yearMonthTemp 
    })

    transYearMonth.sort((a,b)=>{
        let ab = Number(b.split('-').join(''))
        let cd = Number(a.split('-').join(''))
        return ab-cd
    })

    for (let i = 0; i < transYearMonth.length; i++){
        if(i===0){
            yearMonths.push(transYearMonth[i])
        } else {
            let temp = 0
            for(let a = 0; a < i; a++){
                if(transYearMonth[a] === transYearMonth[i]){temp++}
            }
            if(temp===0){yearMonths.push(transYearMonth[i])}
        }
    }

    const data = { accs, years, yearMonths}
    return data
}

const endDateHandler = (reqYear, reqMonth) => {
    const year = reqYear
    const month = reqMonth
    let endMonth = 0
    
    if(month === 2) {
        year % 4 === 0 ? endMonth = 29 : endMonth = 28
    } else if (month <= 7) {
        month % 2 === 0 ? endMonth = 30 : endMonth = 31
    } else {
        month % 2 > 0 ? endMonth = 30 : endMonth = 31
    }
    
    return endMonth
}


// route halaman Laba Rugi
profitLossRoute.get('/', async (req, res) => {
    const accTypes = await AccType.find({ fState: 'pl' })    
    const parentAccs = await ParentAcc.find()
    const childAccs = await ChildAcc.find()
    
    // filter akun yang ada transaksinya dan tahun yang bersangkutan
    const journals = await Journal.find()
    const journalPeriode = await journals.filter(e=> {
        const n = new Date()
        const yearNow = n.getFullYear()
        const date = e.date.getFullYear()
        if(date == yearNow && e.ref !== 'cj' ){
            return e
        }
    })

    
    
    const data = await accountHandler(accTypes, parentAccs, childAccs, journalPeriode, journals)
    const {accs, years, yearMonths} = data
 
    res.render('report/profit-loss', {
        layout: 'layouts/main-layout',
        title: 'Penghasilan Komprehensif',
        accs,
        years,
        yearMonths,
        date: dateNow,
        msg: req.flash('msg')
    })
})

profitLossRoute.post('/', async (req, res) => {
    const year = req.body.year
    if(year!==''){
        res.redirect(`/report/profit-loss/${year}`)
    }
})

// route halaman Laba Rugi Periode Tahun
profitLossRoute.get('/:year', async (req, res) => {
    const reqYear = req.params.year
    const accTypes = await AccType.find({ fState: 'pl' })
    const parentAccs = await ParentAcc.find()
    const childAccs = await ChildAcc.find()

    // filter akun yang ada transaksinya
    const journals = await Journal.find()
    const journalPeriode = await journals.filter(e=> {
        const yearPeriode = reqYear
        const date = e.date.getFullYear()
        if(date == yearPeriode && e.ref !== 'cj' ){
            return e
        }
    })

    const data = await accountHandler(accTypes, parentAccs, childAccs, journalPeriode, journals)
    const {accs, years, yearMonths} = data
   
    n = new Date()
    y = n.getFullYear()
    const date = reqYear == y ? dateNow: `${reqYear}-12-31`
    res.render('report/profit-loss', {
        layout: 'layouts/main-layout',
        title: 'Penghasilan Komprehensif',
        accs,
        years,
        yearMonths,
        date,
        msg: req.flash('msg')
    })
})


profitLossRoute.post('/periode', async (req, res) => {
    const yearMonth = req.body.yearMonth
    if(yearMonth!==''){
        res.redirect(`/report/profit-loss/periode/${yearMonth}`)
    }
})


// route halaman Laba Rugi Periode Bulan
profitLossRoute.get('/periode/:yearMonth', async (req, res) => {
    const yearMonth = req.params.yearMonth.split('-')
    const reqYear = yearMonth[0]
    const reqMonth = +yearMonth[1]

    const accTypes = await AccType.find({ fState: 'pl' })
    const parentAccs = await ParentAcc.find()
    const childAccs = await ChildAcc.find()

    // filter akun yang ada transaksinya
    const journals = await Journal.find()
    const journalPeriode = await journals.filter(e=> {
        const year = e.date.getFullYear()
        const month = e.date.getMonth() + 1

        if(year == reqYear && month == reqMonth && e.ref !== 'cj' ){
            return e
        }
    })

    const data = await accountHandler(accTypes, parentAccs, childAccs, journalPeriode, journals)
    const {accs, years, yearMonths} = data
   
    n = new Date()
    y = n.getFullYear()
    m = String(n.getMonth() + 1)
    let date = ''
    if (reqMonth == m && reqYear == y) {
        date = dateNow
    } else {
        const endDate = endDateHandler(reqYear, reqMonth)
        date = `${reqYear}-${reqMonth}-${endDate}`
    }

    res.render('report/profit-loss', {
        layout: 'layouts/main-layout',
        title: 'Penghasilan Komprehensif',
        accs,
        years,
        yearMonths,
        date,
        msg: req.flash('msg')
    })
})




// profitLossRoute.get('/:nama', async (req, res) => {
//     const contact = await Contact.findOne({ nama: req.params.nama })
//     res.render('detail', {
//         layout: 'layouts/main-layout',
//         title: 'Halaman Detail Contact',
//         contact
//     })
// })


module.exports = profitLossRoute