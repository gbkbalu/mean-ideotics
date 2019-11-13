const mongoose = require('mongoose')

if(mongoose.connection.readyState == 0){
    mongoose.connect("mongodb://localhost/demo-apr2", { useNewUrlParser: true })
}
