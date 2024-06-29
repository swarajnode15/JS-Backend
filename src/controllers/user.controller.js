 import { asyncHandler } from "../utils/asyncHandler.js";
 import { ApiError } from "../utils/ApiError.js";
 import { User } from "../models/user.model.js";
 import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { upload } from "../middlerwares/multer.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";

 const registerUser = asyncHandler(async(req,res)=>{
    //get user details from frontend 
    //validation - not empty
    //check if user already exist: username, email
    //check for images, check for avatar
    //upload them to cloudinary, avatar
    //create user object- create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res
    
    //gets values from frontend by destructuring 
    const{fullname,username,email,password}=req.body

    //validation - empty fields 
    if([fullname,username,email,password].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"all field are required")
     }

     //It performs a query to find a single document in the User collection that matches one of the specified conditions. 
     const existedUSer = await User.findOne({
        $or: [{ username },{ email }]
     })

     if(existedUSer){
        throw new ApiError(409,"User with username or email already exits")
     }

     //gets local path of avatar and coverImage
     //  The ternary operator is used to provide a default value (undefined in this case) if any part of the chain is missing, thus preventing runtime errors.
     const avtarLocalPath= req.files && req.files.avatar && req.files.avatar[0] ? req.files.avatar[0].path : undefined;
     const coverImageLocalPath= req.files && req.files.coverImage && req.files.coverImage[0] ? req.files.coverImage[0].path : undefined;
 
    //another way of checking any part of the chain is missing
    //  let coverImageLocalPath;
    //  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
    //     coverImageLocalPath= req.files?.coverImage[0]?.path;
    //  }

     // check is avatar localpath exists 
     if(!avtarLocalPath){
        throw new ApiError(400,"avatar file is required")
     }

     //uploading avatar and coverImage on cloudinary
    const avatar = await uploadOnCloudinary(avtarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
 

    if(!avatar){
        throw new ApiError(400,"avatar file is required")
    }

    //pushing it on db
   const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //removing password and refresh token
   const ceratedUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!ceratedUser){
        throw new ApiError(500,"somthing went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200,ceratedUser,"User registered succefully")
    )

 })

 



 export {registerUser}