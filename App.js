const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const createWebSocketServer = require("./routes/webSocket");
const userDetails = require("./routes/userDetails");

const app = express();
const port = 3000;
require("dotenv/config");

const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");

app.use(cors());
app.options("*", cors());

//Middlewares
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("tiny"));
app.use(authJwt());
app.use(errorHandler);

app.use((req, res, next) => {
  req.wss = wss; // Make the WebSocket server accessible in routes
  next();
});

const api = process.env.API_URL;
const userRoute = require("./routes/userRoute");

app.use(`${api}/users`, userRoute);
app.use(`${api}/users`, userDetails);

const dbConfig = require("./config/database.config");
mongoose.Promise = global.Promise;

mongoose
  .connect(dbConfig.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connected to the database");
  })
  .catch((err) => {
    console.log("Could not connect to the database. Exiting now...", err);
    process.exit();
  });

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

const wss = createWebSocketServer(server);

app.use((req, res, next) => {
  req.wss = wss;
  next();
});
