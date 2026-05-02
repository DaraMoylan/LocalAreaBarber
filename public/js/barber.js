// Js file to serve to public/barber-dashboard.html

const token = localStorage.getItem('token');

if(!token) { 
	window.location.href = '/login.html';
}

const payload = JSON.parse(atob(token.split('.')[1]));

// check that the user is a barber
if(payload.role !== 'barber') { 
	window.location.href = '/login.html';
}

document.getElementById('barber-name').textContent = payload.firstName;

/*
* Function that his the /services endpoint
* requires the requireBarber token
*/
async function loadServices() { 
	const response = await fetch('/services', { 
		headers: { 'Authorization': `Bearer ${token}`}
	});

	const services = await response.json();
	const servicesList = document.getElementById('services-list');
	if(services.length === 0) { 
		servicesList.innerHTML = '<p>Please add a service</p>';
		return
	}

// map the services to the services-list div
	servicesList.innerHTML = services.map(service =>
    `<div class="card" id="service-${service.id}">
      <div class="service-display">
        <strong>${service.name}</strong>
        <p>${service.duration_minutes} mins - €${service.price}</p>
        <button class="edit-btn" onclick="showEdit(${service.id}, '${service.name}', ${service.duration_minutes}, ${service.price})">Edit</button>
        <button class="cancel-btn" onclick="deleteService(${service.id})">Delete</button>
      </div>
      <div class="service-edit" style="display: none;">
        <input type="text" id="edit-name-${service.id}" value="${service.name}">
        <input type="number" id="edit-duration-${service.id}" value="${service.duration_minutes}">
        <input type="number" id="edit-price-${service.id}" value="${service.price}">
        <button onclick="saveEdit(${service.id})">Save</button>
        <button class="cancel-btn" onclick="cancelEdit(${service.id})">Cancel</button>
      </div>
    </div>`
  ).join('');
}

/*
*  Function to flip the display of the two divs
*/
function showEdit(serviceId) { 
	const card = document.getElementById(`service-${serviceId}`);
	card.querySelector('.service-display').style.display = 'none';
	card.querySelector('.service-edit').style.display = 'block';
}

/*
* Flip it back
*/
function cancelEdit(serviceId) { 
	const card = document.getElementById(`service-${serviceId}`);
	card.querySelector('.service-display').style.display = 'block';
	card.querySelector('.service-edit').style.display = 'none';
}

/*
* Function to retrieve the data we want from the dom
* and send a HTTP POST request with the data as the request
* hit the /services endpoint
*/
async function addService() { 
	const name = document.getElementById('service-name').value;
	const duration_minutes = document.getElementById('service-duration').value;
	const price = document.getElementById('service-price').value;

	// check that all fields are filled
	if(!name || !duration_minutes || !price) { 
		document.getElementById('message').textContent = 'Please fill in all fields';
		return;
	}

	const response = await fetch('/services', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify({ name, duration_minutes, price })
	});

	const data = await response.json();
// confirm to the user that the service has been added
	if(response.ok) { 
		document.getElementById('service-name').value = '';
		document.getElementById('service-duration').value = '';
		document.getElementById('service-price').value = '';
		document.getElementById('message').textContent = 'Service added!';
		loadServices();
	} else {
		document.getElementById('message').textContent = data.error;
	}
}

/*
* Function that takes the serviceId
* replaces the original service in the services table with a new one with the same serviceId
*/
async function saveEdit(serviceId) { 
	const name = document.getElementById(`edit-name-${serviceId}`).value;
	const duration_minutes = document.getElementById(`edit-duration-${serviceId}`).value;
	const price = document.getElementById(`edit-price-${serviceId}`).value;

	const response = await fetch(`/services/${serviceId}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify({ name, duration_minutes, price })
	});

	const data = await response.json();

	// check that response was ok
	if(response.ok) {
		document.getElementById('message').textContent = 'Service updated!';
		loadServices();
	} else {
		document.getElementById('message').textContent = data.error;
	}
}

/*
*  Function to delete a service
*  hit the /services/serviceId endpoint with a DELETE request
*/
async function deleteService(serviceId) { 
	
	if(!confirm('Are you sure you want to delete this service?')) { 
		return;
	}

	const response = await fetch(`/services/${serviceId}`, { 
		method: 'DELETE', 
		headers: {
			'Authorization': `Bearer ${token}`
		}
	});

	const data = await response.json();

	if(response.ok) {
		document.getElementById('message').textContent = 'Service successfully deleted!';
		loadServices();
	} else {
		document.getElementById('message').textContent = data.error;
	}
}

/*
* Function that sends a GET request to /barber/booings endpoint
* maps the bookings to the html
*/
async function loadBookings() { 
	const response = await fetch('/barber/bookings', { 
		headers: { 'Authorization': `Bearer ${token}`, }
	});
	
	const bookings = await response.json();

	const bookingsList = document.getElementById('bookings-list');

	if(bookings.length === 0) {
		bookingsList.innerHTML = '<p>No bookings yet</p>';
		return;
	}

	bookingsList.innerHTML = bookings.map(booking =>
		`<div class="card">
		<strong>${booking.service_name}</strong>
		<p>${booking.customer_first_name} ${booking.customer_last_name}</p>
		<p>${booking.booking_datetime} - ${booking.status}</p>
		</div>`
	).join('');
}

/*
* Logout function
* removes token and role from localStorage
* redirects to login.html
*/
function logout() { 
	localStorage.removeItem('token');
	localStorage.removeItem('role');
	window.location.href = '/login.html';
}

loadServices();
loadBookings();
