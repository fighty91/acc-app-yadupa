const mongoose = require('mongoose')

// schema
const Journal = mongoose.model('Journal', {
    date: {
        type: Date,
        require: true
    },
    description: {
        type: String
    },
    ref: {
        type: String,
        require: true
    },
    journalTrans: [
        {
            accChildId: {
                type: String,
                require: true
            },
            debet: {
                type: Number,
                require: true
            },
            credit: {
                type: Number,
                require: true
            },
            info: {
                type: String
            }
        }
    ],
    transNumber: {
        type: Number,
        require: true
    }
})

module.exports = Journal