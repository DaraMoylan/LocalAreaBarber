// authorisation middleware file 

const jwt = require('jsonwebtoken');

// Arrow function to authenticate the JWT token
// check the token exists, if so decode the token and attach the decoded token onto the request object with req.user
// the req travels to the actual route handler so that I can access req.user.role or req.user.userId without having to verify the token again
const authenticateToken = (req, res, next) => { 
	
	// grab the value of the authorization header off the incoming request object
	const authHeader = req.headers['authorization'];
	// check authHeader exists and split it into just the token
	const token = authHeader && authHeader.split(' ')[1];

	if(!token) { 
		return res.status(401).json({ error: 'Access denied. No token provided.' });
	}

	try { 
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		// attach the decoded token to the request object
		req.user = decoded;
		// tell express to move on to the next function in the chain
		next();

	} catch(error) { 
		return res.status(403).json({ error: 'Invalid or expired token.' });
	}
}

// function to check for barber role
const requireBarber = (req, res, next) => { 
	
	if(req.user.role != 'barber') { 
		return res.status(403).json({ error: 'Barber permissions required.' });
	}
	next();

}

// export my functions
module.exports = { authenticateToken, requireBarber };
