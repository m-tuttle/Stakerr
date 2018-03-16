// dependencies
var express = require("express");
var bodyParser = require("body-parser");
var connection = require("./config/connection.js");

var app = module.exports = express();

var session = require("express-session");

app.use(session({ secret: "app", resave: false, saveUninitialized: true, cookie: {secure: false, maxAge: 1000 * 60 * 60 * 24}}));

app.use(bodyParser.urlencoded({ extended: false }));

// Set Handlebars.
var exphbs = require("express-handlebars");

var hbs = exphbs.create({
    defaultLayout: "main"
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

// goals feed route (displays all the active goals)
app.get("/", function (req, res) {
    var query = "SELECT u.user, g.goal_text FROM goals g LEFT JOIN users u ON u.id=g.user_id WHERE g.complete=0"

    connection.query(query, function (err, data) {
        if (err) throw err;
        res.render("goalsfeed", {"goals": data})
    })
})

// my account view display route
app.get("/myaccount", function (req, res) {
    var query1 = "SELECT * FROM users WHERE id=?"
    var query2 = "SELECT * FROM users u LEFT JOIN goals g ON u.id=g.user_id WHERE u.id=?"
    connection.query(query1, [req.session.user_id], function (err, data1) {
        if (err) throw err;
        connection.query(query2, [req.session.user_id], function (err, data2) {
            if (err) throw err;
            res.render("accountview", {"users": data1[0], "goals": data2})
        })
    })
})

// create goal display route
app.get("/create", function (req, res) {
    var query = "SELECT * FROM users WHERE id=1";

    connection.query(query, function (err, data) {
        if (err) throw err;
        res.render("creategoal", {"goals": data})
    })
})

// login page
app.get("/login", function (req, res) {
    res.render("login")
})

// user loggin in
app.post("/userlogin", function (req, res) {
    var query = "SELECT * FROM users WHERE user=?"
    connection.query(query, [req.body.user], function (err, data) {
        if (err) throw err;
        if (req.body.user_pw === data[0].user_pw) {
            req.session.logged_in = true;
            req.session.user_id = data[0].id;
            res.redirect("/");
        } else {
            res.redirect("/login");
            console.log("Incorrect login")
        }
    })
})

// new user landing page
app.get("/newuser", function (req, res) {
    res.render("newuser");
})

// post route for new user creation
app.post("/newuser", function (req, res) {
    res.redirect("/login");
    var query = "INSERT INTO users SET ?"
    connection.query(query, req.body, function (err, data) {
        if (err) throw err;
    })
})

// set server to listen 
var port = process.env.PORT || 3000;
app.listen(port);


