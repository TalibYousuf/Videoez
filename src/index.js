require('dotenv').config();
const express = require('express');
const connectDB = require('./db/db.js');
const apiResponse = require('./utils/apiResponse.js');
const app = require('./app.js')

app.use(express.json());

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed:", err);
  });

// Example route
// app.get('/user', (req, res) => {
//     const user = { id: 1, name: "talib" };
//     const response = new apiResponse(200, user, "data registered successfully");
//     res.status(response.statusCode).json(response);
// });
console.log("✅ index.js executed successfully");