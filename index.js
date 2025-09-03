    const mongoose = require('mongoose')
    const cors = require('cors')
    const express = require('express')
    require('dotenv').config();
    const path=require('path')
    const app=express()
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
   
    const Router=require('./Routes/Routes')

    const PORT = process.env.PORT || 5000;
    const URL = process.env.MONGO_URL;
    mongoose.connect(URL,{ useNewUrlParser: true, useUnifiedTopology: true }).then(console.log('MongoDB is connected')).catch((err)=>{console.log('Server Error',err)})

    app.use('/api/',Router)
    app.get('/', (req, res) => {
    res.send('Backend is live!');
});

    app.listen(PORT,()=>{
         console.log(` Server running on port ${PORT}`);
    })
