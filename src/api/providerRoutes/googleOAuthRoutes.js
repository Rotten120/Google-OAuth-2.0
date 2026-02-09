import express from "express"
import { prisma } from "../../lib/prismaClient.js"
import { googleAuthService } from "../../lib/googleAuthClient.js"
import { setCookie } from "../../lib/cookies.js"

const router = express.Router();

router.get("/callback", async (req, res) => {
  const q = req.query;

  if(q.error) {
    console.log("Error: ", q.error);
    res.end(" error has occurred");
    return;
  } else if(!googleAuthService.verifyState(q.state)) {
    console.log("State mismatch. Possible CSRF attack");
    res.end(" State mismatch. Possible CSRF attack");
    return;
  }

  //since oauth is only used for login, access tokens and refresh tokens
  //are not stored in the database

  try {
    const tokens = await googleAuthService.getToken(q.code);
    const payload = await googleAuthService.getPayload(tokens.idToken);

    if(!payload.email_verified) {
      return res.status(409).json({ message: "Email not verified, try to manually login or sign up" });
    }

    const oauthacc = await prisma.oAuthAccount.findFirst({
      where: {
        provider: "google",
        providerUserId: payload.sub
      },
      select: { userId: true }
    })

    // user is logged in if the account already exist
    if(oauthacc) {
      const token = await setCookie(res, oauthacc.userId);

      return res.send({ message: "Account successfully logged in", token });
    }

    // what happens next are conditions where the oauthaccount
    // does not exist
    let userDB = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { id: true }
    });

    // if the user is also not in the database, server creates 
    if(!userDB) {
      userDB = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name
        }
      });
    }

    // create the oauthaccount
    await prisma.oAuthAccount.create({
      data: {
        userId: userDB.id,
        provider: "google",
        providerUserId: payload.sub
      }
    })

    const token = await setCookie(res, userDB.id);

    return res.status(201).json({ message: "Account successfully registered", token })
  } catch(error) {
    console.log("Error found: ", error); 
    return res.status(500).json(error);
  }
});

router.get("/redirect", (req, res) => { 
  const authUrl = googleAuthService.generateAuthUrl();
  return res.redirect(authUrl);
})

export default router;
