var mysql = require('mysql')

const host        = "localhost",
    user        = "root",
    password    = "root",
    database    = "node";

const connection = mysql.createConnection({
    host: host,
    user: user,
    password: password,
    database: database
});

connection.connect((err) => {
    console.log("DB Connected !");
});

module.exports = connection;