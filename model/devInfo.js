const mongoose = require('mongoose')

// schema
const DevInfo = mongoose.model('DevInfo', {
    violation: {
        type: Boolean,
        require: true
    },
    description: {
        type: String
    }
})

module.exports = DevInfo