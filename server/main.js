// Libraries
require('dotenv').config()
const path = require('path');
const express = require('express');
const mysql = require("mysql");
// const bodyParser = require("body-parser");

// Instance of Express
const app = express();

//Configure a connection pool to the database
console.log("process.env.DB_PORT => ",process.env.DB_PORT);

console.log(process.env.DB_PASSWORD);
const pool = mysql.createPool({
    host: process.env.DB_HOST, 
    port: process.env.DB_PORT, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, 
    connectionLimit: process.env.DB_CONLIMIT
    // debug: true
});

console.log(pool);

var makeQuery = (sql, pool)=>{
    console.log(sql);
    
    return  (args)=>{
        let queryPromsie = new Promise((resolve, reject)=>{
            pool.getConnection((err, connection)=>{
                if(err){
                    reject(err);
                    return;
                }
                console.log(args);
                
                connection.query(sql, args || [], (err, results)=>{
                    connection.release();
                    if(err){
                        reject(err);
                        return;
                    }
                    console.log(">>> "+ results);
                    resolve(results); 
                })
            });
        });
        return queryPromsie;
    }
}

//Book by title & author
const sqlFindAllBooks = "SELECT cover_thumbnail, title, author_lastname, author_firstname FROM books WHERE (title LIKE ?) || (author_lastname LIKE ?) || (author_firstname LIKE ?) LIMIT ? OFFSET ?";
var findAllBooks = makeQuery(sqlFindAllBooks, pool);

//Book by id
const sqlFindBookById = "SELECT * FROM books WHERE id=? ";
var findBookById = makeQuery(sqlFindBookById, pool);

//Routes

    //Book by id (params)
    app.get("/books/:bookId", (req, res)=>{
    console.log("/book params !");
    let bookId = req.params.bookId;
    console.log(bookId);
    findBookById([parseInt(bookId)]).then((results)=>{
        console.log(results);
        res.json(results);
    }).catch((error)=>{
        res.status(500).json(error);
    })
 
 })

    //Book by query
    app.get("/books", (req, res)=>{
        console.log("/books !");
        var bookId = req.query.id;
        console.log(bookId);
        
        if(typeof(bookId) === 'undefined' ){
            console.log(req.query);
            console.log(">>>" + bookId);
            var keyword = req.query.keyword;
            var selectionType = req.query.selectionType;
            console.log(keyword);
            console.log(selectionType);
            
            let finalCriteriaFromType = ['%', '%' , parseInt(req.query.limit), parseInt(req.query.offset)];
            if(selectionType == 'BT'){
                finalCriteriaFromType = ['%' + keyword + '%', '' , '', parseInt(req.query.limit),parseInt(req.query.offset)]
            }
    
            if(selectionType == 'A'){
                finalCriteriaFromType = ['', '%' +keyword + '%','%' +keyword + '%', parseInt(req.query.limit),parseInt(req.query.offset)]
            }
    
            if(selectionType == 'B'){
                finalCriteriaFromType = ['%' + keyword + '%', '%' +keyword + '%', '%' +keyword + '%', ,parseInt(req.query.limit),parseInt(req.query.offset)]
            }
            console.log ("here - ",finalCriteriaFromType);
            findAllBooks(finalCriteriaFromType)
            .then((results)=>{
                console.log(results);
                res.json(results);
            }).catch((error)=>{
                res.status(500).json(error);
            });
        }else{
            findBookById([parseInt(bookId)]).then((results)=>{
                console.log(results);
                res.json(results);
            }).catch((error)=>{
                res.status(500).json(error);
            });
        }   
    })

    app.use(express.static(path.join(__dirname, 'public')));

app.use((req, resp) => {
    // resp.redirect('/')
    resp.status(404);
    resp.sendfile(path.join(__dirname, 'public', '404.html'));
});

// port and server
const PORT = parseInt(process.argv[2]) || 
           parseInt(process.env.APP_PORT) || 3000;
app.listen(PORT, () => {
   console.info(`App started on port ${PORT} at ${new Date()}`);
});
