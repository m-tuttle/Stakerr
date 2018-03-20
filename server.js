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

        var query = "SELECT u.user, g.user_id, g.goal_id, g.goal_text, g.goal_end, g.raised, g.max_wager, g.user_following, g.prog, f.total FROM users u LEFT JOIN goals g ON u.id=g.user_id LEFT JOIN fol f ON g.goal_id=f.goal_id WHERE g.complete=0";

        connection.query(query, function (err, data) {
            if (err) throw err;
            console.log(data);
            for(var i=0; i < data.length; i++) {
                if(data[i].user_following === 0) {
                data[i].user_following = "Follow";
                }
                else {
                data[i].user_following = "Followed";
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
    var query = "SELECT u.user, u.credits, g.goal_text, g.max_wager, g.raised, g.follows, g.goal_id, g.goal_end FROM goals g LEFT JOIN users u ON u.id=g.user_id WHERE g.goal_id=?";

    connection.query(query, [parseInt(req.params.goalid)], function (err, data) {
        if (err) throw err;
        balance = data[0].credits;
        raised = data[0].raised;
        max = data[0].max_wager;

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
        "goal_id": req.body.goal_id,
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
    })
    var query3 = "UPDATE goals SET ? WHERE ?";
    var params3 = [
        {
            "raised": parseInt(req.body.raised) + parseInt(req.body.wager_amount)
        }, 
        {
            "goal_id": req.body.goal_id
        }
    ];
    connection.query(query3, params3, function (err, data) {
        if (err) throw err; 
    })
    req.session.credits = params2[0].credits;
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

