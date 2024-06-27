//Asynchronous Error Handling
const asyncHandler = (reqestHandler)=>{
   return (req,res,next)=>{
        Promise.resolve(reqestHandler(req,res,next)).
        catch((err)=>next(err))
    }

}

export {asyncHandler}