import jwt from "jsonwebtoken";

const secretKey = "secretKey";

const token = jwt.sign(
  {
    ass: "jv",
    name: "Joao",
    email: "joao@example.com",
  },
  secretKey
);

console.log(token);

const tokenVerify = jwt.verify(token, secretKey);

console.log(tokenVerify);
