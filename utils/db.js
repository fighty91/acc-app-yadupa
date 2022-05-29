const mongoose = require('mongoose');
// mongoose.connect('mongodb://127.0.0.1:27017/acc-app', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     useCreateIndex: true
// })

mongoose.connect('mongodb://fighty91:fighty123@cluster0-shard-00-00.nzn5m.mongodb.net:27017,cluster0-shard-00-01.nzn5m.mongodb.net:27017,cluster0-shard-00-02.nzn5m.mongodb.net:27017/acc-app-yadupa?ssl=true&replicaSet=atlas-3bsnl7-shard-0&authSource=admin&retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
})




// tambah satu data (contoh)
// const contact1 = new Contact({
//     nama: 'Fighty Ratag',
//     nohp: '082231110632',
//     email: 'fighty@gmail.com'
// })

// // simpan ke collection
// contact1.save().then((result) => console.log(result))