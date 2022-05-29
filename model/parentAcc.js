const mongoose = require('mongoose')

// schema
const ParentAcc = mongoose.model('ParentAcc', {
    accName: {
        type: String,
        require: true
    },
    accCode: {
        type: String,
        require: true,
        unique: true
    },
    accBalance: {
        type: String,
        require: true
    },
    accType: {
        type: Object,
        require: true
    },
    important: {
        type: Boolean
    }
})

module.exports = ParentAcc