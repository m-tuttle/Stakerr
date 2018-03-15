// dependencies
var express = require("express");
var bodyParser = require("body-parser");
var connection = require("./config/connection.js");

var app = module.exports = express();

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
    var query = "SELECT * FROM users WHERE id=1"
    
    connection.query(query, function (err, data) {
        if (err) throw err;
        res.render("accountview", {"goals": data})
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

// new user landing page
app.get("/newuser", function (req, res) {
    res.render("newuser");
})

// set server to listen 
var port = process.env.PORT || 3000;
app.listen(port);


