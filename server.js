const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// Define route for GET requests to the root URL
app.get('/', (req, res) => { 
	res.send('Hello World from Express!');
});

// Start the server
app.listen(port, () => { 
	console.log(`Server running on http://localhost:${port}`);
});
