import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path"
import passport from 'passport';

import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import userRoutes from "./routes/user.route.js"
import { connectDB } from "./lib/db.js";
import { app,server } from "./lib/socket.js";
import './lib/passport.js'; 


dotenv.config()
const PORT = process.env.PORT
const __dirname = path.resolve();

app.use(cors({
    origin: process.env.NODE_ENV === "production"
            ? "https://chat-app-0mh4.onrender.com" 
            : "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser())

app.use(passport.initialize());

app.use('/api/auth', authRoutes)
app.use('/api/message', messageRoutes)
app.use('/api/user', userRoutes)

if(process.env.NODE_ENV === "production"){
  app.use(express.static(path.join(__dirname,'../Frontend/dist')));

  app.get("*",(req,res)=>{
    res.sendFile(path.join(__dirname,"../Frontend","dist","index.html"));
  })
}

server.listen(PORT, ()=>{
    console.log(`Server is running on port: ${PORT}`);
    connectDB()
})