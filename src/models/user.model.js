/*
This code defines a Mongoose schema for a User model in a Node.js application. 
It also includes methods for password hashing, password comparison, and JWT generation for authentication.
*/

import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"


const userSchema = new Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        fullname:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type: String,
            required: true, 
        },
        coverImage:{
            type: String,
        },
        watchHistory:{
            type: Schema.Types.ObjectId,
            ref:"Video"
        },
        password:{
            type:String,
            required:[true,'Password is required']
        },
        refreshToken:{
            type: String
        }
    },
    {
        timestamps: true
    }

)

// Pre-save Middleware Hook:

userSchema.pre("save", async function (next){
    if(!this.isModified("password")) return next()
    
    this.password = bcrypt.hash(this.password,10)
    next()
})

// This is where you can define instance methods for documents created with the userSchema. 
// Instance methods are functions that can be called on instances (documents) of the model.

userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullname: this.fullname

    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
}
userSchema.methods.generateRefreshToken= function(){
    return jwt.sign({
        _id:this._id,

    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const User = mongoose.model("User",userSchema)