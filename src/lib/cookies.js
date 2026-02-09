import { generateToken } from "./auth.js"

export const setCookie = async (res, payload, age = 60*60*24*7) => {
  const token = payload? await generateToken(payload) : "";

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: age
  });

  return token;
}
