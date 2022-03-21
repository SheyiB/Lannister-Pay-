const mongoose = require('mongoose');

const feeSchema = mongoose.Schema({
    FeeID: {
        type: String,
        required: [true, 'Provide Valid fee ID'],
        unique: true
    },
    FeeCurrency: {
        type: String,
    },
    FeeLocale  : {
        type: String,
    },
    FeeEntity : {
        type: String,
    },
    EntityPpty : {
        type: String,
    },
    FeeType : {
        type: String,
    },
    FeeValue: {
        type: String,
    }

});





module.exports = mongoose.model('feeSchema', feeSchema);