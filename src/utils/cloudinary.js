// This code is for uploading a file to Cloudinary, 
// a cloud-based image and video management service, using the Cloudinary API. 
// It also handles error cases by removing the local file if the upload fails.

import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});


const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null

    //upload file
    const response = await cloudinary.uploader.upload(localFilePath,{
        resource_type: "auto"
    })

    //remove file after success 
    fs.unlinkSync(localFilePath)

    //file has been uploaded successfull
    // console.log("file is uploaded on cloudinary", response.url);

    return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the localy saved temp file as op failed 
    }
  
}

export {uploadOnCloudinary}