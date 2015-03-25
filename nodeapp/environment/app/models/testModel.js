var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TestSchema = new Schema({
    line: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    }
});

TestSchema.methods = {

}

TestSchema.statics = {

}

var Test = mongoose.model('Test', TestSchema);


