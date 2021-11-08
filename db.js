const mongoose = require('mongoose');
const config = require('./config/default');
let db = config.dev.db

module.exports = function() {
    mongoose.connect(db, { useNewUrlParser: true , useUnifiedTopology: true})
        .then(() => console.log(`Connected to ${db}...`))
        .catch(()=>console.log(`Coudn't connect to ${db}...`))
}
