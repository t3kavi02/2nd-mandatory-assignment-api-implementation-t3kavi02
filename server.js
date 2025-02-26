const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // for parsing application/json

// ------ WRITE YOUR SOLUTION HERE BELOW ------//

const passport = require('passport');
const jwtStrategy = require('passport-jwt').Strategy;
const extractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');

const MYSECRETJWTKEY = 'MY_SWEET_CAT_FRIEND';

const optionsForJwtValidation = {
  jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: MYSECRETJWTKEY
};

const userInformation = {
  userHandle: "",
  password: ""
}

passport.use(new jwtStrategy(optionsForJwtValidation, function (payload, done) {
  if (payload.user === userInformation.userHandle) {
    return done(null, { user: payload.user });
  } else {
    return done(null, false);
  }
}));


const scoreInformation = [{
  level: "",
  userHandle: "",
  score: "",
  timestamp: ""
}];


app.post('/signup', (req, res) => {

  // Extract userHandle and password from the request body
  const { userHandle, password } = req.body;

  // Check if userHandle and password are present in the request body and are at least 6 characters long
  if (!userHandle || !password || userHandle.length < 6 || password.length < 6) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  // Save userHandle and password in userInformation object
  userInformation.userHandle = userHandle;
  userInformation.password = password;


  // If everything is correct, send a response with status code 201
  res.status(201).send("User registered successfully");
});


app.post('/login', (req, res) => {

  // For demonstration purposes, we assume the user is 'admin' with role 'admin'
  const accessToken = jwt.sign({ user: userInformation.userHandle }, MYSECRETJWTKEY);
  const { userHandle, password } = req.body;

  //check if userHandle and password are present and there is no extra data in the request body and they both are strings
  if (!userHandle || !password || Object.keys(req.body).length > 2 || typeof userHandle !== 'string' || typeof password !== 'string') {
    return res.status(400).send("Bad request");
  }


  if (userHandle === userInformation.userHandle && password === userInformation.password) {
    res.json({ 'jsonWebToken': accessToken });
  } else {
    res.status(401).json({ error: "Unauthorized, incorrect username or password" });
  }

});

app.post('/high-scores', passport.authenticate('jwt', { session: false }), (req, res) => {

  const { level, userHandle, score, timestamp } = req.body;
  const token = req.headers.authorization

  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized, JWT token is missing or invalid" });
  }

  if (!level || !userHandle || !score || !timestamp) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  if (req.user) {

    const newPost = {
      level: level,
      userHandle: userHandle,
      score: score,
      timestamp: timestamp
    }
    scoreInformation.push(newPost);

    res.status(201).send("High score posted successfully");
  }
});

app.get('/high-scores', async (req, res) => {
  try {
    const { level, page } = req.query;

    if (!level) {
      return res.status(400).json({ error: "Level is required" });
    }

    // Filter and sort scores
    const filteredScores = scoreInformation.filter(score => score.level === level);
    const sortedScores = filteredScores.sort((a, b) => b.score - a.score);

    // Handle pagination
    const pageLimit = 20;
    const currentPage = parseInt(page, 10) || 1;
    const startIndex = (currentPage - 1) * pageLimit;
    const endIndex = currentPage * pageLimit;

    // Slice the scores array for pagination
    const paginatedScores = sortedScores.slice(startIndex, endIndex);

    // Return paginated scores
    return res.status(200).json(paginatedScores);
  } catch (error) {
    
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};
