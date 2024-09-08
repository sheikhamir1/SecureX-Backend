require("dotenv").config();
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const mongoDbConnect = require("./ConnectMongodb/ConnectToMongodb");
const cors = require("cors");
// connect mongodb connect
mongoDbConnect();

const port = process.env.PORT || 4000;

const corsConfig = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};
app.options("*", cors(corsConfig));
app.use(cors(corsConfig));

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// // user authentication routes (register, login)
app.use("/api/auth", require("./Routes/User"));

// document routes
app.use("/api/doc", require("./Routes/Document"));
app.use("/api/sharedoc", require("./Routes/ShareDoc"));

// profile routes
app.use("/api/profile", require("./Routes/Profile"));

// testing route
app.get("/", (req, res) => {
  res.send("backend deployed!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
