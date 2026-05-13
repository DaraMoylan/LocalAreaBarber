// Handle the customer side logic for the customer-dashboard.html

const token = localStorage.getItem('token');

/*
* Function to check if the token exists and/or is expired
* @param: token from localStorage
* @return {JSON payload}
*/
function checkToken(token) { 
	if(!token) {
		window.location.href = '/login.html';
		return false;
	}
	
	const payload = JSON.parse(atob(token.split('.')[1]));
	const now = Math.floor(Date.now() / 1000);

	if(payload.exp < now) { 
		localStorage.removeItem('token');
		localStorage.removeItem('role');
		window.location.href = '/login.html';
		return false;
	}

	return payload;
}

const payload = checkToken(token);
if(!payload) { 
	throw new Error('Invalid token');
}
// Role check
if(payload.role !== 'customer') { 
	window.location.href = '/login.html';
}
document.getElementById('customer-name').textContent = payload.firstName;

/*
* function to format the Dates 
*/
function formatDate(dateString) { 
	const date = new Date(dateString);
	return date.toLocaleString('en-IE', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

/*
* Function to highlight the particular barber you clicked on
*/
function selectBarber(barberId) { 
// Remove selected from all barber cards
// clear the message 
	document.getElementById('message').textContent = '';
	document.querySelectorAll('#barber-list .card').forEach(card => {
		card.classList.remove('selected');
	});

	// Add selected to the clicked one
	document.getElementById(`barber-${barberId}`).classList.add('selected');
	loadServices(barberId);
}

let selectedServiceId = null;

// function to load barbers by querying /barbers endpoint
async function loadBarbers() {
	const barberList = document.getElementById('barber-list');
	barberList.innerHTML = '<p>Loading barbers...</p>';

	const response = await fetch('/barbers');
	const barbers = await response.json();

	if(barbers.length === 0) {
		barberList.innerHTML = '<p>No barbers available</p>';
		return;
	}

	barberList.innerHTML = barbers.map(barber => 
		`<div class="card" id="barber-${barber.id}" onclick="selectBarber(${barber.id})">
		${barber.first_name} ${barber.last_name}
		</div>`
	).join('');
}

async function loadServices(barberId) { 
// fetch the endpoint
	const response = await fetch(`/barbers/${barberId}/services`);
	const services = await response.json();

	const servicesList = document.getElementById('services-list');
	document.getElementById('services-section').style.display = 'block';

	if(services.length == 0) { 
		servicesList.innerHTML = '<p>No services available</p>';
		return;
	}

	servicesList.innerHTML = services.map(service => 
		`<div class="card" id="service-${service.id}" onclick="selectService(${service.id})">
		<strong>${service.name}</strong>
		<p>${service.duration_minutes} mins - €${service.price}</p>
		</div>`
	).join('');
}

function selectService(serviceId, event) { 

	document.getElementById('message').textContent = '';
	document.querySelectorAll('#services-list .card').forEach(card => {
		card.classList.remove('selected');
	});
	document.getElementById(`service-${serviceId}`).classList.add('selected');
	selectedServiceId = serviceId;
	document.getElementById('booking-section').style.display = 'block';
}

async function createBooking() { 
	document.getElementById('message').textContent = '';
	const bookingTime = document.getElementById('booking-time').value;
	
	// check input validation
	if(!bookingTime) { 
		document.getElementById('message').textContent = 'Please select a date and time';
		return;
	}

	const response = await fetch('/bookings', { 
		method: 'POST',
		headers: {
			'Content-Type': 'application/json', 
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify({
			service_id: selectedServiceId, 
			booking_datetime: bookingTime
		})
	});
	
	const data = await response.json();

	if(response.ok) { 
		document.getElementById('message').textContent = 'Booking confirmed!';
		document.getElementById('message').style.color = '#27ae60';
		document.getElementById('booking-section').style.display = 'none';
		document.getElementById('services-section').style.display = 'none';
		loadBookings();
	} else { 
		document.getElementById('message').textContent = data.error;
		document.getElementById('message').style.color = '#e74c3c';
	}
}

async function loadBookings() { 

	const response = await fetch('/bookings', { 
		headers: { 'Authorization': `Bearer ${token}` }
	});
	
	const bookings = await response.json();

	const bookingsList = document.getElementById('bookings-list');

	// add a filter for the cancelled bookings
	const activeBookings = bookings.filter(booking => booking.status !== 'cancelled');

	if(activeBookings.length === 0) { 
		bookingsList.innerHTML = '<p>No bookings yet</p>';
		return;
	}

	bookingsList.innerHTML = activeBookings.map(booking =>
		`<div class="card">
     	 <strong>${booking.service_name}</strong> with ${booking.barber_first_name} ${booking.barber_last_name}
     	 <p>${formatDate(booking.booking_datetime)} - ${booking.status}</p>
     		 ${booking.status !== 'cancelled' ?
        `<button class="cancel-btn" onclick="cancelBooking(${booking.id})">Cancel</button>` : ''}
   	 </div>`
	).join('');
}
/**
* Cancel a Booking
* @param {number} bookingId - The ID of the booking of a barber service
*/
async function cancelBooking(bookingId) { 
	document.getElementById('message').textContent = '';
	const response = await fetch(`/bookings/${bookingId}`, {
		method: 'PATCH',
		headers: { 
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
	},
	body: JSON.stringify({ status: 'cancelled' })
	});

	const data = await response.json();

	if(response.ok) {
		loadBookings();
		document.getElementById('message').textContent = 'Booking cancelled';
		document.getElementById('message').style.color = '#27ae60';
	} else {
		document.getElementById('message').textContent = data.error;
		document.getElementById('message').style.color = '#e74c3c';
	}
}

	
function logout() { 
	localStorage.removeItem('token');
	localStorage.removeItem('role');
	window.location.href = '/login.html';
}

// Load data when page opens
loadBarbers();
loadBookings();
