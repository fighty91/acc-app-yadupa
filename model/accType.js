const mongoose = require('mongoose')

// schema
const AccType = mongoose.model('AccType', {
    typeName: {
        type: String,
        require: true
    },
    fState: {
        type: String,
        require: true
    }
})

module.exports = AccType