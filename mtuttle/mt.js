var mysql = require("mysql");

var connection = mysql.createConnection({
    port: 3306,
    host: "localhost",
    user: "root",
    password: "",
    database: "project_db"
});

// Make connection.
connection.connect(function (err) {
    if (err) {
        console.error("error connecting: " + err.stack);
        return;
    }
    console.log("connected as id " + connection.threadId);
});

// query to grab user name and goal text for all uncompleted goals (goal feed display?)
var query = "SELECT u.user, g.goal_text FROM goals g LEFT JOIN users u ON u.id=g.user_id WHERE g.complete=0"

connection.query(query, function (err, data) {
    if (err) throw err;
    console.log(data);
})  