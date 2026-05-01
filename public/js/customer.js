// Handle the customer side logic for the customer-dashboard.html

const token = localStorage.getItem('token');

// check for the JWT Token and handle the situation
if(!token) { 
	window.location.href = '/login.html';
}



// decode the token to get the customer's name
const payload = JSON.parse(atob(token.split('.')[1]));
// Role check
if(payload.role !== 'customer') { 
	window.location.href = '/login.html';
}
document.getElementById('customer-name').textContent = payload.firstName;

let selectedServiceId = null;

// function to load barbers by querying /barbers endpoint
async function loadBarbers() { 
	const response = await fetch('/barbers');
	const barbers = await response.json();

// manual DOM manipulation
	const barberList = document.getElementById('barber-list');
	barberList.innerHTML = barbers.map(barber => 
		`<div class="card" onclick="loadServices(${barber.id})">
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
		`<div class="card" onclick="selectService(${service.id})">
		<strong>${service.name}</strong>
		<p>${service.duration_minutes} mins - €${service.price}</p>
		</div>`
	).join('');
}

function selectService(serviceId) { 
	selectedServiceId = serviceId;
	document.getElementById('booking-section').style.display = 'block';
}

async function createBooking() { 
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
		document.getElementById('booking-section').style.display = 'none';
		document.getElementById('services-section').style.display = 'none';
		loadBookings();
	} else { 
		document.getElementById('message').textContent = data.error;
	}
}

async function loadBookings() { 

	const response = await fetch('/bookings', { 
		headers: { 'Authorization': `Bearer ${token}` }
	});
	
	const bookings = await response.json();

	const bookingsList = document.getElementById('bookings-list');

	if(bookings.length === 0) { 
		bookingsList.innerHTML = '<p>No bookings yet</p>';
		return;
	}

	bookingsList.innerHTML = bookings.map(booking =>
		`<div class="card">
     	 <strong>${booking.service_name}</strong> with ${booking.barber_first_name} ${booking.barber_last_name}
     	 <p>${booking.booking_datetime} - ${booking.status}</p>
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
	} else {
		document.getElementById('message').textContent = data.error;
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
