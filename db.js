//var sqlite3 = require('sqlite3').verbose()
import sqlite3 from "sqlite3"

const DBSOURCE = "./db.sqlite"


export const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message)
        throw err
    } else {
        console.log('Connected to the SQLite database.')
        db.run(`CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE, 
            refresh_token text, 
            access_token text, 
            CONSTRAINT user_id_unique UNIQUE (user_id)
            )`, (err) => {
            if (err) {
                // Table already created
            } else {
                // Table just created, creating some rows
                //var insert = 'INSERT INTO user (name, email, password) VALUES (?,?,?)'
                //db.run(insert, ["admin","admin@example.com",md5("admin123456")])
                //db.run(insert, ["user","user@example.com",md5("user123456")])
            }
        });
        db.run(`CREATE TABLE playback_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            data text)`, (err) => {
            if (err) {
                // Table already created
            } else {
                // Table just created, creating some rows
                //var insert = 'INSERT INTO user (name, email, password) VALUES (?,?,?)'
                //db.run(insert, ["admin","admin@example.com",md5("admin123456")])
                //db.run(insert, ["user","user@example.com",md5("user123456")])
            }
        })
    }
});


