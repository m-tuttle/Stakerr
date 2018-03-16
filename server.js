// dependencies
var express = require("express");
var bodyParser = require("body-parser");
var connection = require("./config/connection.js");

var app = module.exports = express();

app.use(express.static("."));

var session = require("express-session");

app.use(session({ secret: "app", resave: false, saveUninitialized: true, cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } }));

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

    if (req.session.logged_in) {
        var query = "SELECT u.user, g.goal_text, g.goal_end, g.max_wager FROM goals g LEFT JOIN users u ON u.id=g.user_id WHERE g.complete=0";

        connection.query(query, function (err, data) {
            if (err) throw err;
            res.render("goalsfeed", { "goals": data });
        })
    } else {
        res.redirect("/login");
    }
})

// my account view display route
app.get("/myaccount", function (req, res) {
    if (req.session.logged_in) {
        var query1 = "SELECT * FROM users WHERE id=?"
        var query2 = "SELECT * FROM goals g WHERE user_id=?"
        connection.query(query1, [req.session.user_id], function (err, data1) {
            if (err) throw err;
            connection.query(query2, [req.session.user_id], function (err, data2) {
                if (err) throw err;
                res.render("accountview", { "users": data1[0], "goals": data2 })
            })
        })
    } else {
        res.redirect("/login");
    }
})

// create goal display route
app.get("/create", function (req, res) {
    if (req.session.logged_in) {
        var query = "SELECT * FROM users WHERE id=1";

        connection.query(query, function (err, data) {
            if (err) throw err;
            res.render("creategoal", { "goals": data })
        })
    } else {
        res.redirect("/login");
    }
})

// post route for new goals
app.post("/create", function (req, res) {
    var query = "INSERT INTO goals SET ?"
    var goal_start = new Date()
    connection.query(query,
        {
            "user_id": req.session.user_id,
            "goal_text": req.body.goal_text,
            "goal_start": goal_start,
            "goal_end": new Date(),
            "max_wager": req.body.max_wager,
            "descript": req.body.descript
        },
        function (err, data) {
            if (err) throw err
            res.redirect("/myaccount");
        }
    )
})

// view goal displayroute
app.get("/view", function (req, res) {
    // var query = "SELECT u.user, g.goal_text, g.goal_end, g.max_wager FROM goals g LEFT JOIN users u ON u.id=g.user_id WHERE g.complete=0"

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


