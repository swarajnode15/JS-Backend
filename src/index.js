import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path:'./env'
})


connectDB()









/* Approch 1 to connect to DB using IIFE

import express from "express"
const app = express()

(async()=>{
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on("error",(error)=>{
        console.log("error",error);
        throw error
    })

    app.listen(process.env.PORT,()=>{
        console.log(`app is listening on port ${process.env.PORT}`);
    })

    } catch (error) {
        console.log(error);
    }
})()
*/