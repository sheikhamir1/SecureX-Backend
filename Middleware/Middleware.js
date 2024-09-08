const jwt = require("jsonwebtoken");
const JWT_SECRET_KEY = process.env.JWT_ACCESS_TOKEN;

const CheckIfUserLoggedIn = (req, res, next) => {
  const authHeader = req.header("Authorization")?.replace("Bearer ", "");
  if (!authHeader) {
    return res.status(401).send({ error: "Authorization denied" });
  }
  try {
    const decoded = jwt.verify(authHeader, JWT_SECRET_KEY);

    // console.log("this is decoded detail in middleware", decoded);
    req.user = decoded;
    // console.log("this is user", req.user);

    // console.log("this is decoded.email", decoded.user.email);
    // console.log("this is userid", req.user);
    next();
  } catch (error) {
    res.status(401).send({ error: "Please authenticate using a valid token" });
  }
};

module.exports = CheckIfUserLoggedIn;
