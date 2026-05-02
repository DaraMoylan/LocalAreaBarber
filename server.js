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
// Serve the files inside the public folder
app.use(express.static('public'));

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

	// add a try/catch
	try{
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

	} catch(error) { 
		if(error.message.includes('UNIQUE constraint failed')) { 
			return res.status(400).json({ error: 'An account with this email already exists'});
		}
		return res.status(500).json({ error: 'Something went wrong'});
		}
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

// Update a service (barber only) PUT request
app.put('/services/:id', authenticateToken, requireBarber, (req, res) => {
	
	// Grab the service ID from the URL params
	const serviceID = req.params.id;
	// destructure the req object body
	// const {email, password} = req.body;
	const {name, duration_minutes, price} = req.body;


	if(!name || !duration_minutes || !price) {
		return res.status(400).json({ error: 'Name, duration and/or price not found' });
	}

	try {
		// prepare the SQL statement to avoid injection
		// WHERE id = ? AND barber_id = ? handles ownership of the service
		// only update the row where both conditions are true, service id matches barber_id
		const stmt = db.prepare(`
			UPDATE services SET name = ?, duration_minutes = ?, price = ?
			WHERE id = ? AND barber_id = ?
			`);

		// database substitutes ? placeholders with the values provided
		const result = stmt.run(name, duration_minutes, price, serviceID, req.user.userId);

		if(result.changes === 0) {
			return res.status(404).json({ error: 'Service not found or not owned by you' });
		}

		res.json({ message: 'Service updated successfully' });
	} catch(error) {
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

// Delete request to remove data from database
app.delete('/services/:id', authenticateToken, requireBarber, (req, res) => {
	const result = db.prepare('DELETE FROM services WHERE id = ? AND barber_id = ?').run(req.params.id, req.user.userId);

	if(result.changes === 0) { 
		return res.status(404).json({ error: 'Service not found' });
	}

	res.json({ message: 'Service deleted' });

});

// Get all barbers (public route)
app.get('/barbers', (req, res) => { 
	const barbers = db.prepare('SELECT id, first_name, last_name FROM users WHERE role = ?').all('barber');

	res.json(barbers);

});

// GET a barber's services ( public route )
app.get('/barbers/:id/services', (req, res) => { 
	const services = db.prepare('SELECT id, name, duration_minutes, price FROM services WHERE barber_id = ?').all(req.params.id);

	res.json(services);

});

// POST /bookings
app.post('/bookings', authenticateToken, (req, res) => { 
	const { service_id, booking_datetime } = req.body;

	// Prevent bookings into the past
	const now = new Date();
	const bookingDate = new Date(booking_datetime);
	if(bookingDate <= now) {
		return res.status(400).json({ error: 'Cannot book a time in the past' });
	}

	// check the service exists
	const service = db.prepare('SELECT * FROM services WHERE id = ?')
	.get(service_id);

	if(!service) { 
		return res.status(404).json({ error: 'Service not found' });
	}

	// check time slot is available for this barber
	const conflict = db.prepare(
	'SELECT id FROM bookings WHERE service_id IN (SELECT id FROM services WHERE barber_id = ?) AND booking_datetime = ? AND status != ?'
	).get(service.barber_id, booking_datetime, 'cancelled');

	if(conflict) { 
		return res.status(409).json({ error: 'Time slot not available '});
	}

	const result = db.prepare(
	'INSERT INTO bookings (customer_id, service_id, booking_datetime) VALUES (?, ?, ?)'
	).run(req.user.userId, service_id, booking_datetime);

	res.status(201).json({
		message: 'Booking created', 
		booking_id: result.lastInsertRowid
	});
});

// GET customer's bookings
app.get('/bookings', authenticateToken, (req, res) => { 
	const bookings = db.prepare(`
		SELECT b.id, b.booking_datetime, b.status, 
		s.name AS service_name, s.price, s.duration_minutes, 
		u.first_name AS barber_first_name, u.last_name AS barber_last_name
		FROM bookings b
		JOIN services s ON b.service_id = s.id
		JOIN users u ON s.barber_id = u.id
		WHERE b.customer_id = ?
	`). all(req.user.userId);

	res.json(bookings);
});

// Get barber's bookings
app.get('/barber/bookings', authenticateToken, requireBarber, (req, res) => {
  const bookings = db.prepare(`
    SELECT b.id, b.booking_datetime, b.status,
           s.name AS service_name, s.price, s.duration_minutes,
           u.first_name AS customer_first_name, u.last_name AS customer_last_name
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    JOIN users u ON b.customer_id = u.id
    WHERE s.barber_id = ?
  `).all(req.user.userId);

  res.json(bookings);
});

// Update booking status (cancel)
app.patch('/bookings/:id', authenticateToken, (req, res) => {
  const { status } = req.body;

  if (status !== 'cancelled') {
    return res.status(400).json({ error: 'Only cancellation is allowed' });
  }

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND customer_id = ?')
    .get(req.params.id, req.user.userId);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (booking.status === 'cancelled') {
    return res.status(400).json({ error: 'Booking is already cancelled' });
  }

  db.prepare('UPDATE bookings SET status = ? WHERE id = ?')
    .run('cancelled', req.params.id);

  res.json({ message: 'Booking cancelled' });
});

// Start the server
app.listen(port, () => { 
	console.log(`Server running on http://localhost:${port}`);
});
