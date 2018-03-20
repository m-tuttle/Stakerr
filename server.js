// dependencies
var express = require("express");
var bodyParser = require("body-parser");
var connection = require("./config/connection.js");
var alert = require("alert-node");
var jsdom = require("jsdom");
var { JSDOM } = jsdom;
var { window } = new JSDOM(`<!DOCTYPE html>`);
var $ = require('jQuery')(window);

var app = module.exports = express();

app.use("/public", express.static('public'));

var session = require("express-session");

app.use(session({ secret: "app", resave: false, saveUninitialized: true, cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } }));

app.use(bodyParser.urlencoded({ extended: true }));

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


// routing for contact form
app.get("/contact", function (req, res) {
    res.render("contact");
  })


  //post route for contact

  app.post("/contact", function (req, res) {

    var query = "SELECT * FROM feedback WHERE contacter = ?"

    connection.query(query, [req.body.user], function (err, response) {

       
            var insert = "INSERT INTO feedback SET ?"
            connection.query(insert, req.body, function (err, data) {
                if (err) throw err;

                res.redirect("/")
            })
        
        })
})


// goals feed route (displays all the active goals)
app.get("/", function (req, res) {

    if (req.session.logged_in) {

        var query = "SELECT u.user, g.user_id, g.goal_id, g.goal_text, g.goal_end, g.raised, g.max_wager, g.user_following, g.prog, f.total FROM users u LEFT JOIN goals g ON u.id=g.user_id LEFT JOIN fol f ON g.user_id=f.user_id WHERE g.complete=0";

        connection.query(query, function (err, data) {
            if (err) throw err;
            
            
            res.render("goalsfeed", { "goals": data });
        })
    } else {
        res.redirect("/login");
    }
})

// feed following post route


app.post("/follow/:goalid", function (req, res) {

    var goal = req.originalUrl.slice(-1);
    
    var user = req.session.user_id;

    var query = "SELECT f.fol, f.user_id, f.goal_id FROM fol f WHERE user_id=" + user + " AND goal_id=" + goal + "";

    connection.query(query, function(err, data) {
        
        if(data.length === 0) {
        
        var post = "INSERT INTO fol SET ?";
        connection.query(post, 
            {
                "fol": 1,
                "user_id": user,
                "goal_id": goal
            }, function(err, data) {
            if (err) throw err;
            console.log("successfully added to the table.");

                var update = "UPDATE goals SET user_following=1 WHERE goal_id=" + goal + " AND user_id=" + user + "";
                connection.query(update, function(err, data) {
                if (err) throw err;
                console.log("New Follow!");

                    var follow = "SELECT goal_id, SUM(fol) FROM fol GROUP BY goal_id";

                    connection.query(follow, function(err, data) {
                        if (err) throw err;
                            var selection = data[goal-1];
                            var second = Object.keys(selection)[1];
                            var tot = selection[second];
                            console.log(tot);
                        if(data.length !== 0) {
                            var update = "UPDATE fol SET total=" + tot + " where goal_id=" + goal +"";
                            connection.query(update, function (err, data) {
                            if (err) throw err;
                            console.log("Successfully updated follows!")
                    })
                    }
                })
                
            
        })
        })
            res.send();
            res.redirect("/");
        }
        else {
            console.log("You are already following this goal.");
            res.redirect("/");
        }
        
    });

    
});




// my account view display route
app.get("/myaccount", function (req, res) {
    if (req.session.logged_in) {
        var query1 = "SELECT * FROM users WHERE id=?"
        var query2 = "SELECT * FROM goals g WHERE user_id=?"
        var query3 = "SELECT f.goal_id, g.goal_text, g.goal_end, g.max_wager, u.user FROM fol f LEFT JOIN goals g ON f.goal_id=g.goal_id LEFT JOIN users u ON g.user_id=u.id WHERE f.user_id=?;"
        connection.query(query1, [req.session.user_id], function (err, data1) {
            if (err) throw err;
            connection.query(query2, [req.session.user_id], function (err, data2) {
                if (err) throw err;
                connection.query(query3, [req.session.user_id], function (err, data3) {
                    if (err) throw err;
                    res.render("accountview", { "users": data1[0], "goals": data2, "follows": data3 });
                })
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
    var query = "SELECT u.user, u.credits, g.goal_text, g.descript, g.max_wager, g.raised, g.follows, g.goal_id, g.goal_end, g.prog FROM goals g LEFT JOIN users u ON u.id=g.user_id WHERE g.goal_id=?";

    connection.query(query, [parseInt(req.params.goalid)], function (err, data) {
        if (err) throw err;

        res.render("viewgoal", { "view": data[0], "user_credits": req.session.credits })
    })
})

var gid;
var wam;
var uid;
var maxWager;
var r;

// route for creating a stake (placing a wager on a goal) 
app.post("/stake/create", function (req, res) {
    var query1 = "INSERT INTO wagers SET ?";
    gid = req.body.goal_id;
    wam = parseInt(req.body.wager_amount);
    uid = req.session.user_id;
    var params1 = {
        "wager_amount": wam,
        "wager_fill": 10,
        "goal_id": gid,
        "user_id": uid
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
    })

    
    var goalquery = "SELECT * FROM goals WHERE ?";
    var goalparams = [
        {
            "goal_id": req.body.goal_id
        }
    ]

    connection.query(goalquery, goalparams, function (err, data) {
        if (err) throw err;
        console.log("updating goal table");
        raised = data[0].raised;
        maxWager = data[0].max_wager;
        newAmount = parseInt(raised + wam);
        var query3 = "UPDATE goals SET ? WHERE ?";
        var prog = (newAmount / parseInt(maxWager)) * 100;
        console.log(raised, wam, newAmount, maxWager, prog, gid, " hello" );
    
        var params3 = [
            {
                "raised": raised + wam,
                "prog": prog
            }, 
            {
                "goal_id": gid
            }
        ];
            connection.query(query3, params3, function (err, data) {
            if (err) throw err; 
        })
    })


    req.session.credits = params2[0].credits;
    app.locals.userBalance = req.session.credits;
    res.send();
})


// app.post("/updateview", function (req, res) {
//     var query2 = "UPDATE goals SET raised=? where id=?";
//     var query3 = "UPDATE users SET credits=? where id=?";
// })


app.get("/logout", function(req, res) {
    res.render("logout");
})


// login page
app.get("/login", function (req, res) {
    res.render("login")
})

app.locals.userBalance = 0;

// user loggin in
app.post("/userlogin", function (req, res) {
    var query = "SELECT * FROM users WHERE user=?";

    connection.query(query, [req.body.user], function (err, data) {
        if (err) throw err;
        if(data.length !== 0) {
            if (req.body.user_pw === data[0].user_pw) {
            req.session.logged_in = true;
            req.session.user_id = data[0].id;
            req.session.credits = data[0].credits;
            app.locals.userBalance = req.session.credits;
            res.redirect("/");
            } else {
            res.redirect("/login");
            alert("Incorrect login. Please try again.")
            console.log("Incorrect login");
            }
        }
        else {
            res.redirect("/login");
            alert("Incorrect login. Please try again.")
            console.log("Incorrect login");
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
            console.log("please select a new username");
            alert("Username already taken. Please try again.")
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

// CONTROLLER FUNCTIONS

// var appController = require("./controllers/appcontrollers.js");
// var followController = require("./controllers/followcontrollers.js");
// var stakeController = require("./controllers/stakecontrollers.js");
// var userController = require("./controllers/usercontrollers.js");

// app.use("/", appController);
// app.use("/follow", followController);
// app.use("/stake", stakeController);
// app.use("/user", userController);

// set server to listen 
var port = process.env.PORT || 3000;
app.listen(port, function(error){
    if (error) {
throw error;
    }
    console.log('asfeasdasfd')
});



///// page functions



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

