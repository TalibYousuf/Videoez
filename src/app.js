const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

console.log("✅ app.js loaded successfully");


const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({limit : '16kb'}))//for parsing the incoming data
app.use(express.urlencoded({extended:true , limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieParser());


// app.use((req, res, next) => {
//   console.log(`➡️ Incoming request: ${req.method} ${req.url}`);
//   next();
// });
//routes import 
const userRouter  = require('./routes/user.routes.js')


//routes declaration
app.use('/api/v1/users',userRouter)




module.exports = app;