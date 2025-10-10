const mongoose = require('mongoose');

// const connectDB = async ()=>{
//     try {
//         const connectionInstance  = await mongoose.connect(process.env.MONGO_URI);
//         console.log(`mongo db connected ${connectionInstance.connection.host}`);
        
//     } catch (error) {
//         console.log("error",error);
//         process.exit(1);
//     }
// }
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined. Check your .env file!");
    }

    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};


module.exports=connectDB;