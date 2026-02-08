import express from 'express';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
  console.log("executed / route");
  res.send("<h1>HELLO</h1>");
})

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
