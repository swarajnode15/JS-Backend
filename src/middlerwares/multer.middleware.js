// This code sets up a file upload mechanism using multer, 
// a middleware for handling multipart/form-data in Node.js, primarily used for uploading files.
import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  
  export const upload = multer({ storage, })