const mongoose = require("mongoose")

const permissionSchema = new mongoose.Schema({
    module:{
        type:String,
        required:true
    },
    actions:{
        add:{ type:Boolean, default:false},
        edit:{ type:Boolean,default:false},
        view:{type:Boolean,default:false},
        delete:{type:Boolean,default:false}
    }
});
module.exports = permissionSchema;