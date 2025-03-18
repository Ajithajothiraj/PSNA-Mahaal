const mysql = require('mysql2');
const bcrypt = require('bcrypt');


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: 'Kapil@1362005', 
    database: 'admindb'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to the Mysql database.');

    
    const email = 'kapilravi03@gmail.com';
    const password = '123';

    
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            return;
        }

        const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
        db.query(sql, [email, hash], (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                return;
            }
            console.log('User inserted successfully!');
            db.end();
        });
    });
});

