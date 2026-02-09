import { generateToken } from "./auth.js"

export const setCookie = async (res, payload) => {
  const token = await generateToken(payload);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60*60*24*7
  });

  return token;
}
