var http        = require('http');
var express     = require("express");
var app         = express();
var _           = require("lodash");
var bodyParser  = require("body-parser");
var jwt         = require('jsonwebtoken');
var jwtBlacklist = require('jwt-blacklist')(jwt);
var jwtRefresh  = require('jsonwebtoken-refresh');
var passport    = require("passport");
var passportJWT = require("passport-jwt");
var ExtractJwt  = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;
var db          = require('./db');
var port        = 3001;

app.use(bodyParser.urlencoded({
  extended: true
}));

// parse application/json
app.use(bodyParser.json())


var jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = 'secretKey';

var strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next)
{
    console.log('payload received', jwt_payload);

    // usually this would be a database call:
    getUsersById(jwt_payload.id).then((user) => {
        console.log(user);
        if (user)
        {
            next(null, user);
        } else
        {
            next(null, false);
        }
    });
});

passport.use(strategy);
app.use(passport.initialize());

app.get("/", function(req, res) {
  res.json({message: "Express is up!"});
});

app.post("/login", function(req, res) {

    if(req.body.name && req.body.password)
    {
        var name        = req.body.name,
            password    = req.body.password;
    }

    getUser(req.body).then((user) => {
        var user = user.shift();

        if(user)
        {
            var payload = {id: user.id},
                token   = jwt.sign(payload, jwtOptions.secretOrKey, {
                expiresIn: 60 * 60 * 5
            });

            res.json({
                status: true,
                token:  token,
                message: "User Found!"
            });
        }
        else
        {
            res.status(401).json({
                status: false,
                message:"Invalid Credentials ! User Not Found "
            });
        }
    });
});

app.post("/secret", isAuthenticated, function(req, res)
{
   res.json({
        status: 'success',
        message: 'Hurrey ! Got the User'
    });
});

app.post("/logout", isAuthenticated, function(req, res)
{
    var token = req.headers.authorization.split(' ').reverse().shift();

    jwtBlacklist.blacklist(token);

    res.json({
        status: 'success',
        message: 'Hurrey ! Logged out successfully !'
    });
});


function isAuthenticated(req, res, next)
{
    passport.authenticate('jwt', function(err, user, info)
    {
        this.session = false;

        if(err)
            throw err;

        if (!user)
        {
            return res.json({message: "USer Note Found"});
        }

        next();
     })(req, res, next);
}

app.listen(port, function() {
  console.log("Express running");
});


var getUser = function (request) {
    return new Promise((resolve, error) => {
        let sql = 'SELECT * FROM usersx WHERE username = "' + request.name + '" AND password = "'+ request.password +'"';

        db.query(sql, (err, response) => {
            resolve(response);
        });
    });
}

var getUsersById = function (userId)
{
    return new Promise((resolve, err) => {
        let sql = 'SELECT * FROM usersx WHERE id ="'+ userId +'"';

        db.query(sql, (err, result) => {
            resolve(result);
        });
    });
}