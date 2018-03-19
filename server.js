// dependencies
var express = require("express");
var bodyParser = require("body-parser");
var connection = require("./config/connection.js");
var jsdom = require("jsdom");
var { JSDOM } = jsdom;
var { window } = new JSDOM(`<!DOCTYPE html>`);
var $ = require('jquery')(window);

var app = module.exports = express();

app.use("/public", express.static('public'));

var session = require("express-session");

app.use(session({ secret: "app", resave: false, saveUninitialized: true, cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } }));

app.use(bodyParser.urlencoded({ extended: false }));

// Set Handlebars.
var exphbs = require("express-handlebars");

var hbs = exphbs.create({
    helpers: {
        dateConversion: function (element) {
            var options = {
                year: "numeric", month: "short",
                day: "numeric", hour: "2-digit", minute: "2-digit"
            };
            return element.toLocaleDateString("en-us", options);
        }
    },
    defaultLayout: "main"
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");


// goals feed route (displays all the active goals)
app.get("/", function (req, res) {

    if (req.session.logged_in) {
        var query = "SELECT u.user, g.id, g.goal_text, g.goal_end, g.raised, g.max_wager, g.fol FROM goals g LEFT JOIN users u ON u.id=g.user_id WHERE g.complete=0";

        connection.query(query, function (err, data) {
            if (err) throw err;

            res.render("goalsfeed", { "goals": data });
        })
    } else {
        res.redirect("/login");
    }
})

// feed following post route

app.post("/", function (req, res) {

    var user = req.session.user_id;
    var following;
    var query = "SELECT f.user_id, f.flng, g.id FROM goals g LEFT JOIN folwng f ON f.flng=g.folwng WHERE f.user_id=2";

    connection.query(query, function(err, data) {
        if(data.length !== 0) {
        var post = "UPDATE folwng SET (flng, follow_id, user_id) VALUES (1," + follow_id + ", " + user +"";
            connection.query(post, function(err, data) {
            if (err) throw err;
            })
        }

    var post = "UPDATE users SET following=true WHERE id=" + user + "";
    connection.query(post, [req.session.user_id], function (err, data) {
        if (err) throw err;
    })


    res.redirect("/")
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
        var query = "SELECT * FROM users WHERE id=?";

        connection.query(query, [req.session.user_id], function (err, data) {
            if (err) throw err;
            res.render("creategoal", data[0])
        })
    } else {
        res.redirect("/login");
    }
})

// post route for new goals
app.post("/create", function (req, res) {
    var query = "INSERT INTO goals SET ?"
    var goal_start = new Date()
    if (req.body.goal_end.length > 5) {
        var goal_end = new Date(req.body.goal_end)
    } else {
        var goal_end = new Date();
        goal_end.setHours(req.body.goal_end.split(":")[0], req.body.goal_end.split(":")[1]);
    }
    console.log(goal_end);
    connection.query(query,
        {
            "user_id": req.session.user_id,
            "goal_text": req.body.goal_text,
            "goal_start": goal_start,
            "goal_end": goal_end,
            "max_wager": req.body.max_wager,
            "descript": req.body.descript
        },
        function (err, data) {
            if (err) throw err
            res.redirect("/myaccount");
        }
    )
})

var balance;
var raised;
var max;

// view goal display route
app.get("/view/:goalid", function (req, res) {
    var query = "SELECT u.user, u.credits, g.goal_text, g.max_wager, g.raised, g.fol, g.id FROM goals g LEFT JOIN users u ON u.id=g.user_id WHERE g.id=?";

    connection.query(query, [parseInt(req.params.goalid)], function (err, data) {
        if (err) throw err;
        console.log(data);
        balance = data[0].credits;
        raised = data[0].raised;
        max = data[0].max_wager;

        console.log(raised);

        // $(".update").on("click", function () {
        //     $("#account").text(balance);
        // });


        var updateProg = function () {
            var prog = (raised / max) * 100;
            $("#progressBarView").attr("style", "width:" + prog + "%");
        }

        var checkProg = function () {
            if (raised < max) {
                updateProg();
            }
            else {
                updateProg();
                $("#progressBarView").attr("style", "width:100%");
                $("#prgsView").text("Complete!");
                $(".interaction").remove();
            }
        };

        checkProg();

        res.render("viewgoal", { "view": data[0], "user_credits": req.session.credits })
    })
})

// route for creating a stake (placing a wager on a goal) 
app.post("/stake/create", function (req, res) {
    var query1 = "INSERT INTO wagers SET ?";
    var params1 = {
        "wager_amount": req.body.wager_amount,
        "wager_fill": 0,
        "goal_id": req.body.id,
        "user_id": req.session.user_id
    };
    connection.query(query1, params1, function (err, data) {
        if (err) throw err;
    })
    var query2 = "UPDATE users SET ? WHERE ?";
    var params2 = [
        {
            "credits": req.body.credits - req.body.wager_amount
        },
        {
            "id": req.session.user_id
        }
    ];
    connection.query(query2, params2, function (err, data) {
        if (err) throw err;
        req.session.credits = params2[0].credits;
        console.log(req.session);
        res.send(data);
    })
})


// app.post("/updateview", function (req, res) {
//     var query2 = "UPDATE goals SET raised=? where id=?";
//     var query3 = "UPDATE users SET credits=? where id=?";
// })


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
            req.session.credits = data[0].credits;
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

    var query = "SELECT * FROM users WHERE user = ?"

    connection.query(query, [req.body.user], function (err, response) {

        if (response.length > 0) {
            console.log("please select a new username")
            res.redirect("/newuser")

        }
        else {
            var insert = "INSERT INTO users SET ?"
            connection.query(insert, req.body, function (err, data) {
                if (err) throw err;

                res.redirect("/login")
            })
        }
    })
})

// set server to listen 
var port = process.env.PORT || 3000;
app.listen(port);


/////// page functions


$("#shortTerm, #longTerm").on("click", function () {
    $("#timeframe").text(this.text);
    if (this.text === "Long Term") {
        $("#timeframeEntry").attr("type", "date")
    }
    else {
        $("#timeframeEntry").attr("type", "time")
    }
})



$(".buyIn").on("click", function () {
    var bet = parseInt($("#stk").val());
    var remaining = max - raised - bet;
    if (account - bet >= 0 && bet > 0 && remaining >= 0) {
        account -= bet;
        raised += bet;
        checkProg();
        Materialize.toast('Stake successfully placed!', 4000)
    }
    else if (bet <= 0) {
        Materialize.toast('Please enter a valid amount.', 4000);
    }
    else if (remaining < 0) {
        remaining = max - raised;
        Materialize.toast('Invalid Amount! Only ' + remaining + ' available left to stake.', 4000)
    }
    else {
        Materialize.toast('Insufficient Funds', 4000)
    }
});