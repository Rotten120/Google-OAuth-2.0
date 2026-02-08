import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { prisma } from "../lib/prismaClient.js"
import { hashPassword, generateToken, verifyPassword } from "../lib/auth.js"

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

    const token = await generateToken(id);

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60*60*24*7
      }
    );

    res.status(201).send({ token })
  } catch(error) {
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

    const isVerified = await verifyPassword(password, userDB.password);
    if(!isVerified) {
      return res.status(409).json({message: "Email or password is incorrect. Please try again"})
    }

    const token = await generateToken(userDB.id);

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60*60*24*7
      }
    );

    res.status(201).send({ token });
  } catch(error) {
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
