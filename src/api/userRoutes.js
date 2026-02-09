import express from "express"
import { prisma } from "../lib/prismaClient.js"
import { verifyPassword, hashPassword } from "../lib/auth.js"

const router = express.Router();

router.get("/", async (req, res) => {
  const { password, ...userDB } = await prisma.user.findUnique({where: { id: req.userId}});
  return res.status(200).send({...userDB}); 
});

router.post("/password", async (req, res) => {
  const { newPassword, oldPassword } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { password: true }
  });

  if(!user.password) {
    const hashedPassword = hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword }
    });

    return res.send({message: "Password set successfully"})
  }

  if(!oldPassword) {
    return res.status(400).send({message: "Old password is required"})
  }

  const isVerified = verifyPassword(oldPassword, user.password);
  if(!isVerified) {
    return res.status(400).send({message: "Old password did not matched. Please try again"})
  }

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: req.userId },
    data: { password: hashedPassword }
  });

  return res.send({message: "Password set successfully"})
})

export default router;
