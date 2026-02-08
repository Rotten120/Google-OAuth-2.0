import express from "express"
import { prisma } from "../lib/prismaClient.js"

const router = express.Router();

router.get("/", async (req, res) => {
  const { password, ...userDB } = await prisma.user.findUnique({where: { id: req.userId}});
  return res.status(200).send({...userDB}); 
});

export default router;
