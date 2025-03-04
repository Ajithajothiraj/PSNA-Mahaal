const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const ExcelJS = require('exceljs');

const app = express();
let generatedOtp; 


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'public')));


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'kapilravi03@gmail.com',
        pass: 'achl zbng qaem pfvv'     
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/manager', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'manager.html')); 
});


app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'forgot-password.html'));
});


app.get('/verify-otp.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'verify-otp.html'));
});

app.get('/reset-password.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'reset-password.html'));
});

app.get('/modal.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'modal.html'));
});

app.get('/calendar.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'calendar.html'));
});

app.get('/enquiry.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'enquiry.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'modal.html'));
});

app.get('/graph.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'graph.html'));
});

app.get('/form.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'form.html'));
});


app.get('/download-excel', async (req, res) => {
    try {

        db.query('SELECT * FROM enquirys', async (err, results) => {
            if (err) throw err;

            if (!results || results.length === 0) {
                return res.status(404).send('No data found.');
            }


            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Data');


            const columns = Object.keys(results[0]).map((col) => ({
                header: col,
                key: col,

                width: col.startsWith('date') ? 20 : 15,
            }));
            worksheet.columns = columns;


            results.forEach((row) => worksheet.addRow(row));


            ['eventdate','date1', 'date2', 'date3', 'date4'].forEach((dateCol) => {
                if (worksheet.getColumn(dateCol)) {
                    worksheet.getColumn(dateCol).numFmt = 'mm/dd/yyyy'; 
                }
            });


            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');

            
            await workbook.xlsx.write(res);
            res.end();
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating Excel file');
    }
});



app.post('/send-otp', (req, res) => {
    const email = req.body.registered_email;

    
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Error fetching email:', err);
            return res.status(500).send('Error occurred');
        }

        if (results.length === 0) {
            return res.send(`<script>alert('This email is not registered. Please try again.'); window.location='/forgot-password';</script>`);
        }


        generatedOtp = Math.floor(100000 + Math.random() * 900000);

        emailForReset = email;

        
        const sqlUpdateOtp = 'UPDATE users SET otp = ? WHERE email = ?';
        db.query(sqlUpdateOtp, [generatedOtp, email], (err, result) => {
            if (err) {
                console.error('Error saving OTP:', err);
                return res.status(500).send('Error saving OTP');
            }

            const mailOptions = {
                from: 'aishwaryapandi958@gmail.com',
                to: 'kapilravi03@gmail.com',
                subject: 'Your OTP Code',
                text: `Your OTP is: ${generatedOtp}`
            };


    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending OTP: ', error);
            return res.status(500).send('Error sending OTP');
        }
        console.log('OTP email sent: ' + info.response);
        res.redirect('/verify-otp.html'); 
    });
});
});
});

app.post('/verify-otp', (req, res) => {
    const { otp, email } = req.body; 

    if (parseInt(otp) === generatedOtp) {
        res.redirect(`/reset-password.html?email=${encodeURIComponent(emailForReset)}`);

    } else {
        res.send(`<script>alert('Invalid OTP, please try again.'); window.location='/verify-otp.html';</script>`);
    }
});


app.post('/verify-otp', (req, res) => {
    const enteredOtp = req.body.otp;

    if (parseInt(enteredOtp) === generatedOtp) {
        res.send('OTP verified successfully!');
    } else {
        res.send('Invalid OTP, please try again.');
    }
});

app.post('/reset-password', (req, res) => {
    const newPassword = req.body.new_password;
    const emailForReset = req.body.email; 

    if (!emailForReset) {
        return res.status(400).send('Email is missing');
    }

    
    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).send('Error occurred while hashing the password');
        }

        
        const sqlUpdatePassword = 'UPDATE users SET password = ? WHERE email = ?';
        db.query(sqlUpdatePassword, [hashedPassword, emailForReset], (err, result) => {
            if (err) {
                console.error('Error updating password:', err);
                return res.status(500).send('Error saving new password');
            }

            console.log('Password reset successful for:', emailForReset);
            res.send('<script>alert("Password reset successful!"); window.location="/login";</script>');
        });
    });
});
app.post('/send-otp', (req, res) => {
    const email = req.body.registered_email;
    
    
    emailForReset = email; 
});


app.get('/thank-you.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'thank-you.html'));
});

app.post('/send-message', async (req, res) => {
    const { name, email, mobile, message } = req.body;

    
    if (!name || !email || !mobile || !message) {
        return res.status(400).send('All fields are required.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send('Invalid email format.');
    }

    const text = `Enquiry from ${name}\nEmail: ${email}\nMobile: ${mobile}\nMessage: ${message}`;

    try {
        
        const adminMailOptions = {
            from: email, 
            to: 'psnamahaaladmin@googlegroups.com', 
            subject: 'New Enquiry from PSNA Mahaal',
            text: text
        };

        await transporter.sendMail(adminMailOptions);

        
        const userMailOptions = {
            from: 'psnamahaaladmin@googlegroups.com', 
            to: email, 
            subject: 'Thank you for contacting PSNA Mahaal',
            text: `Dear ${name},\n\nThank you for reaching out to us. We have received your message and will get back to you soon.\n\nFor further information, please contact us at: \nPhone: 9626157410\n\nBest regards,\nPSNA Mahaal`
        };

        await transporter.sendMail(userMailOptions);

        res.redirect('thank-you.html'); 
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Failed to send message.');
    }
});


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: 'Aishwarya_21', 
    database: 'admindb' 
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to the Mysql database.');
});
app.post('/login', (req, res) => {
    const { email, password } = req.body;

   
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).send('An error occurred');
            return;
        }

        if (results.length === 0) {
            return res.send('Invalid email or password');
        }

        const user = results[0];

   
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).send('An error occurred');
            }

            if (isMatch) {
                
                res.redirect('/modal.html');
            } else {
               
                res.send('Invalid email or password');
            }
        });
    });
});

app.get('/booking', (req, res) => {
    res.redirect('/calendar.html');
});

app.get('/enquiry', (req, res) => {
    res.redirect('/enquiry.html');
});

app.get('/business-analyst', (req, res) => {
    res.redirect('/graph.html');
});


app.post('/verify-otp', (req, res) => {
    const { email, otp, newPassword } = req.body;

    
    const sql = 'SELECT * FROM users WHERE email = ? AND otp = ?';
    db.query(sql, [email, otp], (err, results) => {
        if (err) {
            console.error('Error verifying OTP:', err);
            return res.status(500).send('An error occurred');
        }

        if (results.length === 0) {
            return res.send('Invalid OTP');
        }

        
        bcrypt.hash(newPassword, 10, (err, hash) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).send('An error occurred');
            }

            
            const sqlUpdatePassword = 'UPDATE users SET password = ? WHERE email = ?';
            db.query(sqlUpdatePassword, [hash, email], (err, result) => {
                if (err) {
                    console.error('Error updating password:', err);
                    return res.status(500).send('An error occurred');
                }

                res.send('Password reset successfully. You can now log in with your new password.');
            });
        });
    });
});

app.post('/submit-form', (req, res) => {
    const { name, phone, address, event_time, event_date, event } = req.body;

    
    const selectedDate = new Date(event_date);
    const currentDate = new Date();

    if (selectedDate <= currentDate) {
        return res.status(400).send('Event date must be in the future');
    }

    const sql = `INSERT INTO user (name, phone, address, event_time, event_date, event) 
                 VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(sql, [name, phone, address, event_time, event_date, event], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).send('Server Error');
        }

        console.log('Data inserted:', result);

        
        db.query('SELECT * FROM user', (err, results) => {
            if (err) {
                return res.status(500).send('Error fetching updated events');
            }
            res.status(200).json(results); 
            
        });
    });
});

app.delete('/delete-event', (req, res) => {
    const dateKey=req.query.event_date;
    const phone = req.query.phone; 
    console.log(`Received DELETE request for phone: ${phone},${dateKey}`);
    
    deleteEventFromDatabase(phone,dateKey)
        .then((results) => {
            console.log(`Event for phone: ${phone} deleted successfully.`);
            
            db.query('SELECT * FROM user', (err, events) => {
                if (err) {
                    return res.status(500).send('Error fetching updated events');
                }
                res.status(200).json(events);
            });
        })
        .catch(err => {
            console.error('Error deleting event:', err);
            res.status(500).send('Error deleting event');
        });
});


function deleteEventFromDatabase(phone,dateKey) {
    return new Promise((resolve, reject) => {
        const query = 'DELETE FROM user WHERE phone = ? AND event_date = ?'; 
        db.query(query, [phone,dateKey], (err, results) => {
            if (err) {
                return reject(err);  
            }
            resolve(results);
        });
    });
}


app.get('/get-events', (req, res) => {
    const sql = 'SELECT * FROM user'; 
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).send('Error fetching events');
        }
        res.status(200).json(results); 
    });
});


app.get('/get-events-by-date/:date', (req, res) => {
    const { date } = req.params;
    const sql = 'SELECT * FROM user WHERE event_date = ?';
    db.query(sql, [date], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).send('Error fetching events');
        }
        res.status(200).json(results); 
    });
});





app.post("/submit-form-admindb", (req, res) => {
    const {
        name,
        phone,
        address,
        event,
        event_time,
        dynamic_date1,
        dynamic_date2,
        dynamic_date3,
        dynamic_date4,
        dynamic_date5
    } = req.body;

    const convertDate = (date) => (date ? convertToMySQLDate(date) : null);

    const sql = `
        INSERT INTO enquirys (user_name, phone_number, address1, events, eventtime, eventdate, date1, date2, date3, date4) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            name,
            phone,
            address,
            event,
            event_time,
            convertDate(dynamic_date1),
            convertDate(dynamic_date2),
            convertDate(dynamic_date3),
            convertDate(dynamic_date4),
            convertDate(dynamic_date5),
        ],
        (err, result) => {
            if (err) {
                console.error("Database Error:", err.message); 
                return res.status(500).send("Failed to store data in the database.");
            }
            console.log("Data successfully stored:", result);
            res.status(200).send("Data successfully stored.");
        }
    );
});

function convertToMySQLDate(date) {
    const [day, month, year] = date.split("-");
    return `${year}-${month}-${day}`;
}



app.delete('/delete-event1', (req, res) => {
    const dateKey = req.query.event_date;
    const phone = req.query.phone;

    deleteEnquiryFromDatabase(phone, dateKey)
        .then((results) => {
            console.log(`Enquiry for phone: ${phone} deleted successfully.`);
            db.query('SELECT * FROM enquirys', (err, enquiries) => { 
                if (err) {
                    return res.status(500).send('Error fetching updated enquiries');
                }
                res.status(200).json(enquiries);
            });
        })
        .catch(err => {
            console.error('Error deleting enquiry:', err);
            res.status(500).send('Error deleting enquiry');
        });
});


function deleteEnquiryFromDatabase(phone, dateKey) {
    return new Promise((resolve, reject) => {
        const query = 'DELETE FROM enquirys WHERE phone_number = ? AND eventdate = ?';
        db.query(query, [phone, dateKey], (err, results) => { 
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}


app.get('/get-events1', (req, res) => {
    db.query('SELECT * FROM enquirys', (err, results) => { 
        if (err) {
            console.error('Error fetching enquiry data:', err);
            return res.status(500).send('Error fetching enquiries');
        }
        res.status(200).json(results);
    });
});


app.get('/live-data', (req, res) => {
    const combinedQuery = `
        SELECT 
            YEAR(date_field) AS year, 
            MONTH(date_field) AS month, 
            SUM(enquiry_count) AS total_enquiries, 
            SUM(booking_count) AS total_bookings
        FROM (
            -- Enquiry Data
            SELECT eventdate AS date_field, 1 AS enquiry_count, 0 AS booking_count FROM enquirys
            UNION ALL
            SELECT date1 AS date_field, 1 AS enquiry_count, 0 AS booking_count FROM enquirys
            UNION ALL
            SELECT date2 AS date_field, 1 AS enquiry_count, 0 AS booking_count FROM enquirys
            UNION ALL
            SELECT date3 AS date_field, 1 AS enquiry_count, 0 AS booking_count FROM enquirys
            UNION ALL
            SELECT date4 AS date_field, 1 AS enquiry_count, 0 AS booking_count FROM enquirys

            -- Booking Data
            UNION ALL
            SELECT event_date AS date_field, 0 AS enquiry_count, 1 AS booking_count FROM user
        ) AS combined_data
        WHERE date_field IS NOT NULL
        GROUP BY year, month
        ORDER BY year, month;
    `;

    db.query(combinedQuery, (err, results) => {
        if (err) {
            console.error('Error fetching combined data:', err);
            res.sendStatus(500);
            return;
        }

        const completeResults = fillMissingMonths(results);
        res.json(completeResults);
    });

    function fillMissingMonths(data) {
        const resultMap = {};
        data.forEach(row => {
            resultMap[`${row.year}-${row.month}`] = {
                total_enquiries: row.total_enquiries,
                total_bookings: row.total_bookings,
            };
        });

        const startDate = new Date(data[0].year, data[0].month - 1);
        const endDate = new Date(data[data.length - 1].year, data[data.length - 1].month - 1);

        const filledData = [];
        while (startDate <= endDate) {
            const year = startDate.getFullYear();
            const month = startDate.getMonth() + 1;
            const key = `${year}-${month}`;

            filledData.push({
                year,
                month,
                total_enquiries: resultMap[key]?.total_enquiries || 0,
                total_bookings: resultMap[key]?.total_bookings || 0,
            });

            startDate.setMonth(startDate.getMonth() + 1);
        }

        return filledData;
    }
});

app.get('/live-data1', (req, res) => {
    const query = `
        SELECT 
            MONTH(date_col) AS month, 
            YEAR(date_col) AS year,    
            COUNT(*) AS total_enquiries
        FROM (
            SELECT eventdate AS date_col FROM enquirys
            UNION ALL
            SELECT date1 FROM enquirys
            UNION ALL
            SELECT date2 FROM enquirys
            UNION ALL
            SELECT date3 FROM enquirys
            UNION ALL
            SELECT date4 FROM enquirys
        ) AS all_dates
        WHERE date_col IS NOT NULL
        GROUP BY year, month
        ORDER BY year ASC, month ASC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data: ', err);
            res.sendStatus(500);
            return;
        }
        res.json(results);
    });
});

app.get('/enquirys', (req, res) => {
    const query = 'SELECT * FROM enquirys';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            res.status(500).send('Database error');
        } else {
            console.log('Fetched data:', results); 
            res.json(results);
        }
    });
});


app.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
}); 