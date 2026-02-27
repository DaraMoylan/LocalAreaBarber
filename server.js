// import and create an instance of the express package for node
require('dotenv').config();
const jwt = require('jsonwebtoken');
// imports from auth.js 
const { authenticateToken, requireBarber } = require('./middleware/auth.js');


const express = require('express');
const db = require('./database/db'); // runs db.js
const app = express();  
const port = process.env.PORT || 8080;
const path = require('path');
const bcrypt = require('bcrypt');


// Middleware to parse JSON request bodies
app.use(express.json());

// adds req.body properties to the users form inputs
app.use(express.urlencoded({extended: false}));


// Define route for GET requests to the root URL
app.get('/', (req, res) => { 
	res.send('Hello World from Express!');
});

// Set up route to test the database
app.get('/users', (req, res) => { 
	try { 
	const users = db.prepare('SELECT * FROM users').all();
	res.json(users);
	} catch (error) {
	// set HTTP status code to 500 (internal server error)
	res.status(500).json({ error: error.message});
	}
});

// Set up route to create a new user 
app.post('/register', (req, res) => {
	try {
		const { email, password, role, first_name, last_name} = req.body;

		// Hash my passwords before storing in db
		const saltRounds = 10;
		const password_hash = bcrypt.hashSync(password, saltRounds);

		// prepare SQL insert statement
		const stmt = db.prepare(`
			INSERT INTO users (email, password_hash, role, first_name, last_name)
			VALUES (?, ?, ?, ?, ?)
		`);

		// Execute the statement

		const result = stmt.run(email, password_hash, role, first_name, last_name);

		// send success response if it works
		// 201 is status code for resource created successfully
		res.status(201).json({
			message: 'User created successfully', 
			userId: result.lastInsertRowid
		});
	} catch (error) { 
	res.status(500).json({ error: error.message });
	}
});

// login route
app.post('/login', (req, res) => {
	const {email, password} = req.body;
	
	// same as const email = req.body.email;
	// const password = req.body.password; => destructuring
	
	// check the form doesn't lack an input
	if(!email || !password) { 
		return res.status(400).json({ error: 'Email and password are required'});
	}

	try { 
		const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

		if(!user) { 
			return res.status(401).json({ error: 'Invalid credentials'});
		}
	

		// compare inputted password with stored hashed password
		const passwordMatch = bcrypt.compareSync(password, user.password_hash);
	
		if(!passwordMatch) { 
		return res.status(401).json({error: 'Invalid credentials'});
		}

		// JWT payload
		const payload = { 
			userId: user.id, 
			role: user.role, 
			firstName: user.first_name
		};

		const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

		res.json({
			message: 'Login successful', 
			token, 
			role: user.role
		});
	} catch (error) { 
		res.status(500).json({ error: error.message });
	}
});

// Add a service (barber only route)
app.post('/services', authenticateToken, requireBarber, (req, res) => {
	// destructure the request object body 
	const name = req.body.name;
	const duration_minutes = req.body.duration_minutes;
	const price = req.body.price;

	if(!name || !duration_minutes || !price) { 
		return res.status(400).json({ error: 'Name, duration and price are required' });
	}

	try { 
		// prepare the SQL statement to avoid injection
		const stmt = db.prepare(`
			INSERT INTO services (barber_id, name, duration_minutes, price)
			VALUES (?, ?, ? ,?)
			`);

		// database substitutes ? placeholders with the values provided
		const result = stmt.run(req.user.userId, name, duration_minutes, price);

		// return a http status 201 if succesful
		res.status(201).json({
			message: 'Service created successfully', 
			serviceId: result.lastInsertRowid
		});


	} catch (error) { 
		res.status(500).json({ error: error.message });
	}
});

// Get request route for all services (logged in as barber)
app.get('/services', authenticateToken, requireBarber, (req, res) => {

	try { 
		const services = db.prepare(`
		SELECT * FROM services WHERE barber_id = ?
		`).all(req.user.userId);
		res.json(services);
	} catch (error) { 
		res.status(500).json({ error: error.message });
	}
});

// Start the server
app.listen(port, () => { 
	console.log(`Server running on http://localhost:${port}`);
});
