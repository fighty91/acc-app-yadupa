const balanceSheetRoute = require('express').Router()
const ChildAcc = require('../model/childAcc')
const Journal = require('../model/journal')
const ParentAcc = require('../model/parentAcc')
const AccType = require('../model/accType')
const { handle } = require('express/lib/application')
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
    
    await accs.forEach(a => {
       if(a.parent === '627888639e9554431ce8c575' || a.parent === '627888af9e9554431ce8c579' || a.parent === '627888f59e9554431ce8c57e') {
           netAssetBefore += a.credit
           netAssetBefore -= a.debet
        } else if(a.parent === '627888809e9554431ce8c576' || a.parent === '627888e09e9554431ce8c57c') {
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

balanceSheetHandler = (balanceSheetJournal, parentAccs, childAccs) => {
    // sortir akun induk sesuai urutan
    parentAccs.sort((a, b) => {
        const ab = +a.accCode.split('-').join('')
        const cd = +b.accCode.split('-').join('')
        return ab - cd
    })
    
    // akun induk asset
    let parentCurrentAsset = []
    let parentNonCurrentAsset = []
    parentAccs.forEach(a => {
        const {_id, accName, accCode} = a
        // jika aset lancar
        let debet = 0
        if (a.accType == '6275580381d31a151c476bc4') {
            // cek akunnya
            childAccs.forEach(acc => {
                // jika parentnya aset tidak lancar
                if(acc.parentAcc == a._id){
                    // cek jurnal
                    balanceSheetJournal.forEach(b => {
                        // cek transaksi di jurnal
                        b.journalTrans.forEach(j => {
                            // jika ada akunnya, jumlahkan nilainya
                            if (j.accChildId == acc._id) {
                                debet += j.debet
                                debet -= j.credit
                            }
                        })
                    })
                }
            })
            // jika nilai lebih dari o
            if(debet !== 0) {
                let account = {
                    _id,
                    accCode,
                    accName,
                    value: debet
                }
                // accShortLiabilities.push(account)
                parentCurrentAsset.push(account)
            }

        // jika aset tidak lancar
        } else if(a.accType == '627883359e9554431ce8c562') {
            // cek akunnya
            let debet = 0
            childAccs.forEach(acc => {
                // jika parentnya aset tidak lancar
                if(acc.parentAcc == a._id){
                    // cek jurnal
                    balanceSheetJournal.forEach(b => {
                        // cek transaksi di jurnal
                        b.journalTrans.forEach(j => {
                            // jika ada akunnya, jumlahkan nilainya
                            if (j.accChildId == acc._id) {
                                debet += j.debet
                                debet -= j.credit
                            }
                        })
                    })
                }
            })
            // jika nilai lebih dari o
            if(debet !== 0) {
                let account = {
                    _id,
                    accCode,
                    accName,
                    value: debet
                }
                // accShortLiabilities.push(account)
                parentNonCurrentAsset.push(account)
            }
        }
    })
    
    // sortir akun anak sesuai urutan
    childAccs.sort((a, b) => {
        const ab = +a.accChildCode.split('-').join('')
        const cd = +b.accChildCode.split('-').join('')
        return ab - cd
    })

    let accShortLiabilities = []
    let accLongLiabilities = []
    let netAssetCode = ''
    let netAssetRCode = ''
    childAccs.forEach(a=>{
        const {_id, accChildName, parentAcc, accChildCode} = a
        if(parentAcc == '627886bf9e9554431ce8c56d') {
            // buat liabilitas jangka pendek            
            let credit = 0
            balanceSheetJournal.forEach(b => {
                // cek transaksi di jurnal
                b.journalTrans.forEach(j => {
                    // jika ada akunnya, jumlahkan nilainya
                    if (j.accChildId == _id) {
                        credit += j.credit
                        credit -= j.debet
                    }
                })
            })
            // jika ada nilainya maka, push ke akun liabilitas jangka panjang
            if(credit !== 0) {
                let account = {
                    _id,
                    accChildCode,
                    accChildName,
                    parentAcc,
                    value: credit
                }
                accShortLiabilities.push(account)
            }
        } else if(parentAcc == '627886d89e9554431ce8c56e') {
            // buat liabilitas jangka panjang
            let credit = 0
            balanceSheetJournal.forEach(b => {
                // cek transaksi di jurnal
                b.journalTrans.forEach(j => {
                    // jika ada akunnya, jumlahkan nilainya
                    if (j.accChildId == _id) {
                        credit += j.credit
                        credit -= j.debet
                    }
                })
            })
            // jika ada nilainya maka, push ke akun liabilitas jangka panjang
            if(credit !== 0) {
                let account = {
                    _id,
                    accChildCode,
                    accChildName,
                    parentAcc,
                    value: credit
                }
                accLongLiabilities.push(account)
            }
        // jika akun aset neto
        } else if (_id == '627889ed9e9554431ce8c583') {
            netAssetCode = accChildCode
        // jika akun aset neto pembatasan
        } else if (_id == '62788a019e9554431ce8c584') {
            netAssetRCode = accChildCode
        }
    })

    const data = {parentCurrentAsset, parentNonCurrentAsset, accShortLiabilities, accLongLiabilities, netAssetCode, netAssetRCode}
    return data
}

// route halaman Posisi Keuangan
balanceSheetRoute.get('/', async (req, res) => {
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



    const {netAssetBefore, netAssetRBefore, netAssetNow, netAssetRNow} = netAssets
    const {surDefNA, surDefNAR, otherCompre} = surplusDefisit

    // menjumlahkan nilai aset neto sebelum, sekarang, dan suplus
    const netAssetBalance = netAssetBefore + netAssetNow + surDefNA + otherCompre
    const netAssetRBalance = netAssetRBefore + netAssetRNow + surDefNAR

    const balanceSheetJournal = await journals.filter(e => {
        const year = e.date.getFullYear()
        if(year <= yearNow && e.ref !== 'cj'){
            return e
        }
    })

    const balanceSheet = balanceSheetHandler(balanceSheetJournal, parentAccs, childAccs)

    res.render('report/balance-sheet', {
        layout: 'layouts/main-layout',
        title: 'Posisis Keuangan',
        runningPeriode: 'Tahun',
        netAssetBalance,
        netAssetRBalance,
        balanceSheet,

        years,
        yearMonths,
        date: dateNow,
        msg: req.flash('msg')
    })
})

balanceSheetRoute.post('/', async (req, res) => {
    const year = req.body.year
    if(year!==''){
        res.redirect(`/report/balance-sheet/${year}`)
    }
})

// route halaman Posisi Keuangan Periode Tahun
balanceSheetRoute.get('/:year', async (req, res) => {
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
    res.render('report/balance-sheet', {
        layout: 'layouts/main-layout',
        title: 'Posisis Keuangan',
        runningPeriode: 'Tahun',
        surplusDefisit,
        netAssets,

        years,
        yearMonths,
        date,
        msg: req.flash('msg')
    })
})


balanceSheetRoute.post('/periode', async (req, res) => {
    const datePeriode = req.body.date
    if(datePeriode!==''){
        res.redirect(`/report/balance-sheet/periode/${datePeriode}`)
    }
})


// route halaman Posisi Keuangan Periode Bulan
balanceSheetRoute.get('/periode/:datePeriode', async (req, res) => {
    const datePeriode = req.params.datePeriode.split('-')
    const reqYear = datePeriode[0]
    const reqMonth = +datePeriode[1]
    
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

    // menangkap nilai aset neto pada periode bulan sebelumnya
    const journalBefore = await journals.filter(e => {
        const year = e.date.getFullYear()
        const month = String(e.date.getMonth() + 1)
        const strMonth = month.length === 2 ? month : 0 + month
        const journalYearMonth = year+strMonth
       
        // console.log(yearMonth.join(''))
        if(+journalYearMonth < +datePeriode.join('') && e.ref !== 'cj'){
            return e
        }
    })

    // menangkap nilai aset neto pada periode bulan sekarang
    const journalNow = await journals.filter(e => {
        const year = e.date.getFullYear()
        const month = e.date.getMonth() + 1
        if(year == reqYear && month == reqMonth && e.ref !== 'cj'){
            return e
        }
    })

    const netAssets = await netAssetHandler(journalBefore, journalNow, accTypes, parentAccs, childAccs, journals)
    const surplusDefisit = await surplusDefisitHandler(accs)
    


    const {netAssetBefore, netAssetRBefore, netAssetNow, netAssetRNow} = netAssets
    const {surDefNA, surDefNAR, otherCompre} = surplusDefisit

    // menjumlahkan nilai aset neto sebelum, sekarang, dan suplus
    const netAssetBalance = netAssetBefore + netAssetNow + surDefNA + otherCompre
    const netAssetRBalance = netAssetRBefore + netAssetRNow + surDefNAR

    const balanceSheetJournal = await journals.filter(e => {
        const year = e.date.getFullYear()
        const month = String(e.date.getMonth() + 1)
        const strMonth = month.length === 2 ? month : 0 + month
        const journalYearMonth = year+strMonth
        if(journalYearMonth <= +datePeriode.join('') && e.ref !== 'cj'){
            return e
        }
    })

    const balanceSheet = balanceSheetHandler(balanceSheetJournal, parentAccs, childAccs)

    const monthPeriode = datePeriode[1]
    const endDate = endDateHandler(reqYear, reqMonth)
    const date = `${reqYear}-${monthPeriode}-${endDate}`
    
    res.render('report/balance-sheet', {
        layout: 'layouts/main-layout',
        title: 'Posisis Keuangan',
        runningPeriode: 'Bulan',
        netAssetBalance,
        netAssetRBalance,
        balanceSheet,

        years,
        yearMonths,
        date,
        msg: req.flash('msg')
    })
})




// balanceSheetRoute.get('/:nama', async (req, res) => {
//     const contact = await Contact.findOne({ nama: req.params.nama })
//     res.render('detail', {
//         layout: 'layouts/main-layout',
//         title: 'Halaman Detail Contact',
//         contact
//     })
// })


module.exports = balanceSheetRoute