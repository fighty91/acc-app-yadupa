const mongoose = require('mongoose')

// schema
const ChildAcc = mongoose.model('ChildAcc', {
    accChildName: {
        type: String,
        require: true
    },
    parentAcc: {
        type: Object,
        require: true
    },
    accChildCode: {
        type: String,
        require: true,
        unique: true
    },
    accChildBalance: {
        type: String,
        require: true
    }
})

module.exports = ChildAcc