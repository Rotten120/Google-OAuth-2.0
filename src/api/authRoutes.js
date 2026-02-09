import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { prisma } from "../lib/prismaClient.js"
import { hashPassword, verifyPassword } from "../lib/auth.js"
import { setCookie } from "../lib/cookies.js"

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if(!name || !email || !password) {
      return res.status(400).json({message: "Name, email, and password are required fields"});
    }

    const existingUser = await prisma.user.findUnique({where: {email}});
    if(existingUser) {
      return res.status(409).json({message: "User with this email address already exists"});
    }

    const hashedPassword = await hashPassword(password);

    const { id } = await prisma.user.create({
      data: {email, name, password: hashedPassword} 
    });

    const token = await setCookie(res, id);

    res.status(201).send({ token })
  } catch(error) {
    console.log(error);
    res.status(500).send({message: "Error has been found"});
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if(!email || !password) {
      return res.status(400).json({message: "Email, and password are required fields"});
    }

    const userDB = await prisma.user.findUnique({where: {email}});
    if(!userDB) {
      return res.status(409).json({message: "Email or password is incorrect. Please try again"});
    }

    const userPassword = userDB?.password;
    if(!userPassword) {
      return res.status(409).json({message: "Account was made with OAuth. Plase login with your provider"})
    }

    const isVerified = await verifyPassword(password, userPassword);
    if(!isVerified) {
      return res.status(409).json({message: "Email or password is incorrect. Please try again"})
    }

    const token = await setCookie(res, userDB.id)

    res.status(201).send({ token });
  } catch(error) {
    console.log(error);
    res.status(500).send({message: "Error has been found"});
  } 
});

router.post("/logout", (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0
  });

  res.status(200).send({ message: "Successfully logged out" })
})

export default router;
