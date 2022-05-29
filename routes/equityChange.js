const equityChangeRoute = require('express').Router()
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

const surplusDefisitHandler = async (accs) => {
    // menangkap nilai pendapatan dan beban tanpa pembatasan satu periode
    let surDefNA = 0
    const accNA = await accs.filter(acc=> acc.parent=='627888639e9554431ce8c575' || acc.parent=='627888af9e9554431ce8c579')
    if (accNA.length > 0) { 
        accNA.forEach(acc => {               
            const {debet, credit} = acc
            const value = credit - debet
            surDefNA += value
        })
    }

    // menangkap nilai pendapatan dan beban dengan pembatasan satu periode
    let surDefNAR = 0
    const accNAR = await accs.filter(acc=> acc.parent=='627888809e9554431ce8c576' || acc.parent == '627888e09e9554431ce8c57c')
    if (accNAR.length > 0) { 
        accNAR.forEach(acc => {               
            const {debet, credit} = acc
            const value = credit - debet
            surDefNAR += value
        })
    }
    
    // menangkap nilai pendapatan dan beban komprehensif lain satu periode
    let otherCompre = 0
    const accOtherCompre = await accs.filter(acc=> acc.parent=='627888f59e9554431ce8c57e')
    if (accOtherCompre.length > 0) { 
        accOtherCompre.forEach(acc => {               
            const {debet, credit} = acc
            const value = credit - debet
            otherCompre += value
        })
    }

    const surplusDefisit = { surDefNA, surDefNAR, otherCompre }
    return surplusDefisit
}

const netAssetHandler = async (journalBefore, journalNow, accTypes, parentAccs, childAccs, journals) => {
    // menangkap nilai aset neto pada periode tahun sebelumnya
    let netAssetBefore = 0
    let netAssetRBefore = 0
    await journalBefore.forEach( async e => {
        await e.journalTrans.forEach(a => {
            if(e.ref !== 'cj') {
                if (a.accChildId == '627889ed9e9554431ce8c583'){
                    netAssetBefore += a.credit
                    netAssetBefore -= a.debet
                } else if(a.accChildId == '62788a019e9554431ce8c584'){
                    netAssetRBefore += a.credit
                    netAssetRBefore -= a.debet
                }
            }
        })
    })

    
    const surDefAcc = await accountHandler(accTypes, parentAccs, childAccs, journalBefore, journals)
    const {accs} = surDefAcc
    await accs.forEach(a =>{
       if(a.parent === '627888639e9554431ce8c575' || a.parent === '627888af9e9554431ce8c579' || a.parent === '627888f59e9554431ce8c57e'){
           netAssetBefore += a.credit
           netAssetBefore -= a.debet
        } else if( a.parent === '627888809e9554431ce8c576' || a.parent === '627888e09e9554431ce8c57c') {
            netAssetRBefore += a.credit
            netAssetRBefore -= a.debet
        }
    })
    
    // menangkap nilai aset neto pada periode tahun sekarang
    let netAssetNow = 0
    let netAssetRNow = 0
    await journalNow.forEach(e => {
        if(e.ref !== 'cj') {
            if(e.ref !== 'ob') {
                e.journalTrans.forEach(a => {
                    if (a.accChildId == '627889ed9e9554431ce8c583'){
                        netAssetNow += a.credit
                        netAssetNow -= a.debet
                    } else if(a.accChildId == '62788a019e9554431ce8c584'){
                        netAssetRNow += a.credit
                        netAssetRNow -= a.debet
                    }
                })
            }
        }
    })

    const netAssets = {netAssetBefore, netAssetRBefore, netAssetNow, netAssetRNow}
    return netAssets
}

// route halaman Perubahan Ekuitas
equityChangeRoute.get('/', async (req, res) => {
    const accTypes = await AccType.find({ fState: 'pl' })       
    const parentAccs = await ParentAcc.find()
    const childAccs = await ChildAcc.find()
    
    // filter akun yang ada transaksinya dan tahun yang bersangkutan
    const n = new Date()
    const yearNow = n.getFullYear()

    const journals = await Journal.find()
    const journalPeriode = await journals.filter(e=> {
        const date = e.date.getFullYear()
        if(date == yearNow && e.ref !== 'cj' ){
            return e
        }
    })
    
    const data = await accountHandler(accTypes, parentAccs, childAccs, journalPeriode, journals)
    const {accs, years, yearMonths} = data

    // menangkap nilai aset neto pada periode tahun sebelumnya
    const journalBefore = await journals.filter(e => {
        const year = e.date.getFullYear()
        if(year < yearNow && e.ref !== 'cj'){
            return e
        }
    })

    // menangkap nilai aset neto pada periode tahun sekarang
    const journalNow = await journals.filter(e => {
        const year = e.date.getFullYear()
        if(year === yearNow ){
            return e
        }
    })
    
    const netAssets = await netAssetHandler(journalBefore, journalNow, accTypes, parentAccs, childAccs, journals)
    const surplusDefisit = await surplusDefisitHandler(accs) 

    res.render('report/equity-change', {
        layout: 'layouts/main-layout',
        title: 'Perubahan Aset Neto',
        runningPeriode: 'Tahun',
        surplusDefisit,
        netAssets,

        years,
        yearMonths,
        date: dateNow,
        msg: req.flash('msg')
    })
})

equityChangeRoute.post('/', async (req, res) => {
    const year = req.body.year
    if(year!==''){
        res.redirect(`/report/equity-change/${year}`)
    }
})

// route halaman Perubahan Ekuitas Periode Tahun
equityChangeRoute.get('/:year', async (req, res) => {
    const reqYear = +req.params.year
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

    // menangkap nilai aset neto pada periode tahun sebelumnya
    const journalBefore = await journals.filter(e => {
        const year = e.date.getFullYear()
        if(year < reqYear && e.ref !== 'cj'){
            return e
        }
    })

    // menangkap nilai aset neto pada periode tahun sekarang
    const journalNow = await journals.filter(e => {
        const year = e.date.getFullYear()
        if(year === reqYear ){
            return e
        }
    })
    
    const netAssets = await netAssetHandler(journalBefore, journalNow, accTypes, parentAccs, childAccs, journals)
    const surplusDefisit = await surplusDefisitHandler(accs)

    n = new Date()
    y = n.getFullYear()
    const date = reqYear == y ? dateNow: `${reqYear}-12-31`
    res.render('report/equity-change', {
        layout: 'layouts/main-layout',
        title: 'Perubahan Aset Neto',
        runningPeriode: 'Tahun',
        surplusDefisit,
        netAssets,

        years,
        yearMonths,
        date,
        msg: req.flash('msg')
    })
})


equityChangeRoute.post('/periode', async (req, res) => {
    const yearMonth = req.body.yearMonth
    if(yearMonth!==''){
        res.redirect(`/report/equity-change/periode/${yearMonth}`)
    }
})

// route halaman Perubahan Ekuitas Periode Bulan
equityChangeRoute.get('/periode/:yearMonth', async (req, res) => {
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

    // menangkap nilai aset neto pada periode tahun sebelumnya
    const journalBefore = await journals.filter(e => {
        const year = e.date.getFullYear()
        const month = String(e.date.getMonth() + 1)
        const strMonth = month.length === 2 ? month : 0 + month
       
        const journalYearMonth = year+strMonth
        
        // console.log(yearMonth.join(''))
        if(+journalYearMonth < +yearMonth.join('') && e.ref !== 'cj'){
            return e
        }
    })

    // menangkap nilai aset neto pada periode tahun sekarang
    const journalNow = await journals.filter(e => {
        const year = e.date.getFullYear()
        const month = e.date.getMonth() + 1
        if(year == reqYear && month == reqMonth && e.ref !== 'cj'){
            return e
        }
    })

    const netAssets = await netAssetHandler(journalBefore, journalNow, accTypes, parentAccs, childAccs, journals)
    const surplusDefisit = await surplusDefisitHandler(accs)
    
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
    
    res.render('report/equity-change', {
        layout: 'layouts/main-layout',
        title: 'Perubahan Aset Neto',
        runningPeriode: 'Bulan',
        surplusDefisit,
        netAssets,

        years,
        yearMonths,
        date,
        msg: req.flash('msg')
    })
})




// equityChangeRoute.get('/:nama', async (req, res) => {
//     const contact = await Contact.findOne({ nama: req.params.nama })
//     res.render('detail', {
//         layout: 'layouts/main-layout',
//         title: 'Halaman Detail Contact',
//         contact
//     })
// })


module.exports = equityChangeRoute