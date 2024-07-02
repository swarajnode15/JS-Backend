 import { asyncHandler } from "../utils/asyncHandler.js";
 import { ApiError } from "../utils/ApiError.js";
 import { User } from "../models/user.model.js";
 import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { upload } from "../middlerwares/multer.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";

 const generateAccessTokenAndRefreshToken = async (userId) =>{
   try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave:false})

    return {accessToken,refreshToken}

   } catch (error) {
        throw new ApiError(500,"somting went wrong")
   }


 }

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

 const login = asyncHandler(async (req,res)=>{
    // getting user credentials from frontend
    // username or email
    // find the user
    // password check
    // assign access token and refresh token
    // send cookies

    const {username,email,password} = req.body

    if(!username || !email ){
        throw new ApiError(400,"username or email required")
    }

   const user = await User.findOne({
        $or : [{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentilas")
    }


   const {accessToken,refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

  // getting updated user 
  const loggedInUser = User.findById(user._id).
  select("-password -refreshToken")
   
  //prevents modifying cookies bby user
  const options = {
    httpOnly : true,
    secure : true
  }

  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
        200,
        {
            loggedInUser,
            accessToken,
            refreshToken
        },
        "User Logged In Successfully"
        
    )
  )
 })

 const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken : undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
      }

      return res
      .status(200)
      .clearCookie("accessToken",options)
      .clearCookie("refreshToken",options)
      .json( new ApiResponse(200,{},"user logged out"))


 })


 export {   
    registerUser,
    login,
    logoutUser
}