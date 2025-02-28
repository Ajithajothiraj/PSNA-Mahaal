const months = ["January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let calendarBody;
let monthAndYear;

calendarBody = document.getElementById('calendar-body');
monthAndYear = document.getElementById('monthAndYear');

let today = new Date();  
let bookedDays = {}; 
let savedData1 = JSON.parse(localStorage.getItem('calendarEvents1')) || {};

function showCalendar(month, year) {
    calendarBody.innerHTML = "";  
    let firstDay = new Date(year, month, 1).getDay();  
    monthAndYear.textContent = `${months[month]} ${year}`;  
    let daysInMonth = new Date(year, month + 1, 0).getDate();  
    let date = 1;

    for (let i = 0; i < 6; i++) {  
        let row = document.createElement("tr");

        for (let j = 0; j < 7; j++) {
            let cell = document.createElement("td");

            if (i === 0 && j < firstDay) {
                row.appendChild(cell);  // Empty cells before the first day
            } else if (date > daysInMonth) {
                break;  // Stop if we've exceeded the days in the month
            } else {
                cell.textContent = date;

                const formattedMonth = String(month + 1).padStart(2, '0');
                const formattedDate = String(date).padStart(2, '0');
                let dateKey = `${year}-${formattedMonth}-${formattedDate}`;
                let currentDate = new Date(year, month, date);

                // Highlight today's date
                if (currentDate.toDateString() === today.toDateString()) {
                    cell.classList.add("today-date");
                }

                // Handle past dates
                if (currentDate < today) {
                    cell.classList.add("past-date");

                    // Allow form submission for past dates
                    cell.onclick = () => {
                        document.getElementById('event_date').value = dateKey;
                        document.getElementById('eventModal').style.display = 'block';

                        // Log to ensure the date is correctly set
                        console.log("Past date clicked: ", dateKey);
                    };
                } else {
                    // Handle future dates
                    cell.onclick = () => handleDateClick(dateKey);
                }

                // Apply the booked-date class if there is saved data for this date
                if (savedData1[dateKey]) {
                    cell.classList.add("booked-date");
                }

                cell.setAttribute('data-date', dateKey);
                row.appendChild(cell);
                date++;
            }
        }
        calendarBody.appendChild(row);
    }
}

// Add event delegation for the calendar cells
calendarBody.addEventListener('click', (event) => {
    if (event.target.tagName === 'TD') {
        const dateKey = event.target.getAttribute('data-date');
        handleDateClick(dateKey);
    }
});

// Handle the form submission for both past and future dates
const form1 = document.getElementById('userForm1');

form1.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form1);
    const dateValue = formData.get('event_date');

    // Log to check which date is being submitted
    console.log("Submitting form for date:", dateValue);

    // Push the event to the local savedData after a successful fetch request
    try {
        const response = await fetch('/submit-form-admindb', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(formData).toString(),
        });
        
        if (response.ok) {
            // Add event to local storage after server confirmation
            if (!savedData1[dateValue]) {
                savedData1[dateValue] = [];
            }
            savedData1[dateValue].push({
                name: formData.get('name'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                event_time: formData.get('event_time'),
                event: formData.get('event'),
                event_date: dateValue,
            });

            // Update the local storage
            localStorage.setItem('calendarEvents1', JSON.stringify(savedData1));
            
            // Refresh the calendar view
            showCalendar(currentMonth, currentYear);
            
            alert('Event saved successfully!');
        } else {
            alert('Error submitting form.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while submitting the form.');
    }
});


function fetchEvents() {
    fetch('/get-events1')
        .then(response => response.json())
        .then(data => {
            console.log('Fetched events:', data);
            updateUIWithEvents(data); // This function should update your page with the events
        })
        .catch(error => console.error('Error fetching events:', error));
}

function updateUIWithEvents(events) {
    // Loop through the fetched events and update the UI (calendar) accordingly
    events.forEach(event => {
        const eventDateKey = event.event_date; // Assuming the backend sends event date in this format (e.g., "2024-10-17")

        // If there's saved data in the local storage, merge it with fetched events
        if (!savedData1[eventDateKey]) {
            savedData1[eventDateKey] = []; // Ensure it's an array
        }

        // Push the event into the savedData array for that date
        savedData1[eventDateKey].push({
            name: event.name,
            phone: event.phone,
            address: event.address,
            event_time: event.event_time,
            event_date: eventDateKey
        });

        // Find the corresponding cell in the calendar and mark it as booked
        let cell = document.querySelector(`td[data-date="${eventDateKey}"]`);
        if (cell) {
            cell.classList.add('booked-date'); // Mark the cell as booked
        }
    });

    // After updating the data, re-render the calendar
    showCalendar(currentMonth, currentYear);
}


function deleteEvent(dateKey, phoneNumber, eventIndex) {
    // Ensure the dateKey, phoneNumber, and eventIndex are provided
    if (!dateKey || !phoneNumber || eventIndex === undefined) {
        console.error('dateKey, phone number, and event index are required for deletion.');
        return;
    }

    // Check if the date exists in savedData
    if (savedData1[dateKey]) {
        // Remove the specific event at the given index
        savedData1[dateKey].splice(eventIndex, 1);
        
        // If there are no more events for that date, delete the date entry
        if (savedData1[dateKey].length === 0) {
            delete savedData1[dateKey];
        }

        // Update localStorage with the modified data
        localStorage.setItem('calendarEvents1', JSON.stringify(savedData1));

        // Clear the displayed details
        const detailsDiv = document.getElementById('savedDetails');
        detailsDiv.innerHTML = ''; // Clear the details
        
        // Hide the details div if no events remain for the date
        if (!savedData1[dateKey] || savedData1[dateKey].length === 0) {
            detailsDiv.style.display = 'none'; 
            
            // Make the date available on the calendar
            const cell = document.querySelector(`td[data-date="${dateKey}"]`);
            if (cell) {
                cell.classList.remove('booked-date');  // Remove the booked class
                cell.onclick = () => handleDateClick(dateKey);  // Make cell clickable again
            }
        } else {
            // If there are still events, display remaining details
            displaySavedDetails(dateKey);
        }

        // Update the calendar to reflect the changes
        showCalendar(currentMonth, currentYear);

        // Send delete request to the server
        fetch(`/delete-event1?event_date=${encodeURIComponent(dateKey)}&phone=${encodeURIComponent(phoneNumber)}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (response.ok) {
                alert(`Successfully deleted event for ${dateKey}`);
            } else {
                throw new Error('Failed to delete event on the server.');
            }
        })
        .catch(error => {
            console.error('Error during deletion:', error);
            // Optionally, add logic to revert local changes if server-side deletion fails
        });
    } else {
        console.error('No events found for this date.');
    }
}
document.getElementById('closeDetails').onclick = function() {
    document.querySelector('.details-container').style.display = 'none';
};
function displaySavedDetails(dateKey) {
    const detailsDiv = document.getElementById('savedDetails');
    let eventsData = savedData1[dateKey];

    // If no events found, display a message
    if (!eventsData || eventsData.length === 0) {
        detailsDiv.innerHTML = `<h3>No events for ${dateKey}</h3>`;
        detailsDiv.style.display = 'block';
        return;
    }

    // Display event details
    detailsDiv.innerHTML = `<h3>Details for ${dateKey}</h3>`;
    
    eventsData.forEach((eventData, index) => {
        detailsDiv.innerHTML += `
            <div class="event-details">
                <p><strong>Name:</strong> ${eventData.name}</p>
                <p><strong>Phone:</strong> ${eventData.phone}</p>
                <p><strong>Address:</strong> ${eventData.address}</p>
                <p><strong>Time:</strong> ${eventData.event_time}</p>
                <p><strong>Event:</strong> ${eventData.event}</p>
                <button class="deleteEventBtn" data-index="${index}" data-phone="${eventData.phone}">Delete</button>
                <button class="addEventBtn">Add</button>
            </div>
        `;
    });

    detailsDiv.style.display = 'block';

    // Attach delete button events
    const deleteButtons = detailsDiv.querySelectorAll('.deleteEventBtn');
    deleteButtons.forEach(button => {
        button.onclick = function() {
            const phone = button.getAttribute('data-phone');
            const index = parseInt(button.getAttribute('data-index'));
            deleteEvent(dateKey, phone, index);
        };
    });

    // Attach add button events
    const addButtons = detailsDiv.querySelectorAll('.addEventBtn');
    addButtons.forEach(button => {
        button.onclick = function() {
            detailsDiv.style.display = 'none'; // Hide details
            document.getElementById('event_date').value = dateKey;  
            document.getElementById('eventModal').style.display = 'block'; // Show form
        };
    });
}

// Function to handle the form submission to add a new event

// Function to delete an event

// Close modal when clicking the close button
document.getElementById('closeForm').onclick = function() {
    document.getElementById('eventModal').style.display = 'none';
};



showCalendar(currentMonth, currentYear);
function handleDateClick(dateKey) {
    const eventDetailsDiv = document.getElementById('savedDetails');  // User details modal
    const eventModal = document.getElementById('eventModal');  // Form modal
    const selectedDate = new Date(dateKey);  // Clicked date

    // Initially hide both modals
    eventDetailsDiv.style.display = 'none';
    eventModal.style.display = 'none';

    if (savedData1[dateKey] && savedData1[dateKey].length > 0) {  // If there are saved details for the date
        displaySavedDetails(dateKey);  // Display saved details for the selected date
        eventDetailsDiv.style.display = 'block';  // Show user details

        // If the date is already booked, just show the details and hide the form
        eventModal.style.display = 'none';  // Hide form modal
    } else {
        // If no details, show form modal to add new booking
        document.getElementById('event_date').value = dateKey;  // Set date in the form
        eventModal.style.display = 'block';  // Show form modal
    }
}



document.getElementById('closeForm').onclick = function() {
    document.getElementById('eventModal').style.display = 'none';
};

function previous() {
    currentMonth = (currentMonth === 0) ? 11 : currentMonth - 1;
    currentYear = (currentMonth === 11) ? currentYear - 1 : currentYear;
    showCalendar(currentMonth, currentYear);
}

function next() {
    currentMonth = (currentMonth === 11) ? 0 : currentMonth + 1;
    currentYear = (currentMonth === 0) ? currentYear + 1 : currentYear;
    showCalendar(currentMonth, currentYear);
}

showCalendar(currentMonth, currentYear);
document.getElementById('closeDetails').onclick = function() {
    document.getElementById('detailsModal').style.display = 'none';
};
window.onclick = function(event) {
    const eventModal = document.getElementById('eventModal');
    const detailsModal = document.getElementById('detailsModal');

    // Close the event modal when clicking outside of it
    if (event.target === eventModal) {
        eventModal.style.display = "none";  
    }
    
    // Close the details modal when clicking outside of it
    if (event.target === detailsModal) {
        detailsModal.style.display = "none";  
    }
};


document.getElementById('downloadExcel').addEventListener('click', function() {
    
    const eventsArray = [];

    
    for (let dateKey in savedData1) {
        if (savedData1.hasOwnProperty(dateKey)) {
            savedData1[dateKey].forEach(event => {
                eventsArray.push({
                    Date: event.event_date,
                    Name: event.name,
                    Phone: event.phone,
                    Address: event.address,
                    Time: event.event_time,
                    Event: event.event
                });
            });
        }
    }

   
    const worksheet = XLSX.utils.json_to_sheet(eventsArray);

    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Calendar Events');

    XLSX.writeFile(workbook, 'EnquiryEvents.xlsx');
});





