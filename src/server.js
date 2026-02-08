import express from 'express';
import authRoutes from "./api/authRoutes.js" 
import cookieParser from "cookie-parser"

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
  console.log("executed / route");
  res.send("<h1>HELLO</h1>");
});

app.use("/auth", authRoutes);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
