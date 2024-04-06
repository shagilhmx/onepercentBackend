const jwt = require("express-jwt");

function authJwt() {
  const secret = process.env.secret;
  const api = process.env.API_URL;
  return jwt
    .expressjwt({
      secret,
      algorithms: ["HS256"],
    })
    .unless({
      path: [`${api}/users/login`, `${api}/users/signup`],
    });
}

module.exports = authJwt;
