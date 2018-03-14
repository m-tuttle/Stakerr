// dependencies
var express = require("express");
var bodyParser = require("body-parser");

var app = module.exports = express();

app.use(bodyParser.urlencoded({ extended: false }));

// Set Handlebars.
var exphbs = require("express-handlebars");

var hbs = exphbs.create({
    defaultLayout: "main"
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

// set server to listen 
var port = process.env.PORT || 3000;
app.listen(port);


