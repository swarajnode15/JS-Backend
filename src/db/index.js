import mongoose, { mongo } from "mongoose";
import {DB_NAME} from '../constants.js'

const connectDB = async()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODBURI}/${DB_NAME}`)
        console.log(`DB connected !! : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error('DB connection failed',error)
        process.exit(1)
    }
}

export default connectDB

