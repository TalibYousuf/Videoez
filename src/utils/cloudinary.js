const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { isNull } = require('util');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_SECRET_KEY,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_NAME
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath){
            return null;
        }
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        //if file uploaded successfully
        fs.unlinkSync(localFilePath);
        return response;
        
    } catch (error) {
        fs.unlink(localFilePath)//this will remove the locally saved temporary file as the upload operation got failed
        return null;
        
    }
}
module.exports = uploadOnCloudinary ;