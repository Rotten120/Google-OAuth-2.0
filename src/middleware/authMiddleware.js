import { verifyToken } from "../lib/auth.js"

export const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  if(!token) {
    return res.status(401).json({message: "No token provided"});
  }

  verifyToken(token, (err, decoded) => {
    if(err) {return res.status(401).json({message: "Invalid token"});}
    req.userId = decoded.userId;
    next();
  });
}

