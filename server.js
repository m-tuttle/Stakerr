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

var account;

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
        var query = "SELECT u.user, g.user_id, g.goal_id, g.goal_text, g.goal_end, g.raised, g.max_wager, g.user_following, g.prog, g.follows FROM users u LEFT JOIN goals g ON u.id=g.user_id WHERE g.complete=0";

        connection.query(query, function (err, data) {
            if (err) throw err;
            for (var i=0; i<data.length; i++) {
                if (data[i].user_following === 0) {
                    data[i].user_following = "Follow";
                }
            }
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

    var query = "SELECT f.fol, f.user_id, f.goal_id, f.total FROM fol f WHERE user_id=" + user + " AND goal_id=" + goal + "";

    var folsquery = "SELECT * FROM fol f WHERE goal_id=" + goal + "";
    
    var fols;

    connection.query(folsquery, function (err, data) {
        if (err) throw err;
        if (data.length !== 0) {
        fols = data[0].total;
        console.log(fols + " following");
        }
        else {
            fols = 0;
            console.log("No follows for this goal yet.")
        }
    })

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

                var follow = "SELECT goal_id, SUM(fol) FROM fol GROUP BY goal_id";

                    connection.query(follow, function(err, data) {
                        if (err) throw err;
                            
                        if(data.length !== 0) {
                            console.log(data);
                            var selection = data[goal-1];
                            console.log(selection);
                            var second = Object.keys(selection)[1];
                            var tot = selection[second];
                            console.log(tot);

                            var qry = "SELECT g.goal_id, g.user_id, g.user_following FROM goals g WHERE goal_id=" + goal + " AND user_id=" + user + "";
                            connection.query(qry, function(err, data) {
                                console.log(qry);
                                console.log(data);
                                if (err) throw err;
                                if (data.length === 0){
                                    var update = "UPDATE goals SET follows=" + tot + " WHERE goal_id=" + goal +"";
                                    console.log(update);
                                    connection.query(update, function (err, data) {
                                    if (err) throw err;
                                    console.log("Successfully updated follows!")
                                })
                                }
                                });
                        }
                         });
                    })}
                
        else {
            alert("You are already following this goal.");
            console.log("You are already following this goal.");
            
        }
    
        })
});






// my account view display route
app.get("/myaccount", function (req, res) {
    if (req.session.logged_in) {
        var query1 = "SELECT * FROM users WHERE id=?"
        var query2 = "SELECT * FROM goals g WHERE user_id=?"
        var query3 = "SELECT f.goal_id, g.goal_text, g.goal_end, g.max_wager, u.user, g.user_id FROM fol f LEFT JOIN goals g ON f.goal_id=g.goal_id LEFT JOIN users u ON g.user_id=u.id WHERE f.user_id=?"
        var query4 = "SELECT w.goal_id, w.wager_amount, g.goal_text, g.goal_end, g.max_wager, u.user, g.user_id FROM wagers w LEFT JOIN goals g ON w.goal_id=g.goal_id LEFT JOIN users u ON g.user_id=u.id WHERE w.user_id=?"
        connection.query(query1, [req.session.user_id], function (err, data1) {
            if (err) throw err;
            connection.query(query2, [req.session.user_id], function (err, data2) {
                if (err) throw err;
                connection.query(query3, [req.session.user_id], function (err, data3) {
                    if (err) throw err;
                    connection.query(query4, [req.session.user_id], function (err, data4) {
                        if (err) throw err;
                        res.render("accountview", { "users": data1[0], "goals": data2, "follows": data3, "stakes": data4 });
                    })
                })
            })
        })
    } else {
        res.redirect("/login");
    }
})

// Add balance route

app.post("/myaccount", function (req, res) {
    var query = "UPDATE users SET ? WHERE ?";
    var newBalance = parseInt(app.locals.userBalance) + 500;
    app.locals.userBalance = newBalance;
    var param = [
        {
            "credits": newBalance
        },

        {
            "id": req.session.user_id
        }
    ];

    connection.query(query, param, function (err, data) {
        if (err) throw err;
        console.log("Successfully added funds!");
        res.redirect("/myaccount");
    })
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
    var query = "SELECT u.user, u.id, u.credits, g.goal_text, g.descript, g.max_wager, g.raised, g.follows, g.goal_id, g.goal_end, g.prog FROM goals g LEFT JOIN users u ON u.id=g.user_id WHERE g.goal_id=?";

    connection.query(query, [parseInt(req.params.goalid)], function (err, data) {
        if (err) throw err;

        var con = "SELECT g.user_id, g.goal_id FROM goals g";
        connection.query(con, function(err, val) {
            if (err) throw err;
            
            res.render("viewgoal", { "view": data[0], "user_credits": app.locals.userBalance, "users": val})
        })
        
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
    app.locals.userBalance -= wam;
    var params1 = {
        "wager_amount": wam,
        "wager_fill": 1,
        "goal_id": gid,
        "user_id": uid
    };
    connection.query(query1, params1, function (err, data) {
        if (err) throw err;
    })
    var query2 = "UPDATE users SET ? WHERE ?";
    var params2 = [
        {
            "credits": app.locals.userBalance
        },
        {
            "id": uid
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
    res.send();
})


// logout page
app.get("/logout", function(req, res) {
    res.render("logout");
    
})


// login page
app.get("/login", function (req, res) {
    res.render("login")
})


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
    if (error) throw error;
    console.log('Connected.')
});

