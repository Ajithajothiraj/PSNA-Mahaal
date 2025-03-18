const months = ["January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let calendarBody;
let monthAndYear;

calendarBody = document.getElementById('calendar-body');
monthAndYear = document.getElementById('monthAndYear');
const detailsModal = document.getElementById("detailsModal");
const eventModal = document.getElementById("eventModal");
const addEventButton = document.getElementById("addEventButton");
const modal = document.getElementById('detailsModal');
let selectedDateKey = null;
    


let today = new Date();  
let bookedDays = {}; 

showCalendar(currentMonth, currentYear);
fetchEvents();  // ✅ Ensure it runs when the page loads


function showCalendar(month, year) {
    calendarBody.innerHTML = "";  
    let firstDay = new Date(year, month, 1).getDay();  
    monthAndYear.textContent = `${months[month]} ${year}`;  
    let daysInMonth = new Date(year, month + 1, 0).getDate();  
    let date = 1;

    for (let i = 0; i < 6; i++) {  
        let row = document.createElement("tr");

        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDay) {
                let cell = document.createElement("td");
                row.appendChild(cell);
            } else if (date > daysInMonth) {
                break;
            } else {
                let cell = document.createElement("td");
                cell.textContent = date;

                const formattedMonth = String(month + 1).padStart(2, '0');
                const formattedDate = String(date).padStart(2, '0');
                let dateKey = `${year}-${formattedMonth}-${formattedDate}`;
                console.log('📅 Calendar dateKey:', dateKey);
                let currentDate = new Date(year, month, date);

                if (currentDate.toDateString() === today.toDateString()) {
                    cell.classList.add("today-date");
                }

                if (currentDate < today) {
                    cell.classList.add("past-date");
                    if (bookedDays[dateKey]) {
                        console.log(`📅 Found booked date in bookedDays: ${dateKey}`);  // ✅ Debugging log
                        console.log('🔎 Checking cell:', cell);  // ✅ Log the cell element
                    
                        cell.classList.add("booked-date");  
                        cell.onclick = () => displaySavedDetails(dateKey);
                        let eventDataList = bookedDays[dateKey];
                        let tooltipText = eventDataList.map(event => 
                            `Booked: ${event.name}, ${event.event_time}, ${event.phone}`
                        ).join("\n");
                    
                        cell.setAttribute('title', tooltipText);  
                        cell.onclick = () => displaySavedDetails(dateKey);  
                    } 
                    else {
                        cell.classList.add("disabled");
                        cell.setAttribute('title', 'Unavailable');
                        cell.onclick = null;
                    }
                }

                
                
                else {
                    cell.classList.add("available-date");  // Optional: Style for available dates
                    cell.setAttribute('title', 'Available for booking');
                    cell.onclick = () => handleDateClick(dateKey);  // Show form for booking if available
                }

                cell.setAttribute('data-date', dateKey);
                row.appendChild(cell);
                date++;
            }
        }
        calendarBody.appendChild(row);
    }
}



const form = document.getElementById('userForm');

form.addEventListener('submit', (e) => {
    e.preventDefault(); 
    const formData = new FormData(form); 
    const dateValue = formData.get('event_date'); 
    
    const requestBody = new URLSearchParams(new FormData(form)).toString();
    fetch('/submit-form', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody,
    })
    .then(response => {
        if (response.ok) {
            form.reset(); 
            document.getElementById('eventModal').style.display = 'none'; 
            fetchEvents();  // Re-fetch events to update the calendar
        } else {
            alert('Error submitting form.');
        }
    })
    .catch(error => console.error('Error:', error));
});

function fetchEvents() {
    fetch('/get-events')
    .then(response => response.json())
    .then(events => {
        console.log("📥 Raw Events Data from API:", events); // Debugging log

        if (!Array.isArray(events)) {
            console.error("❌ Expected an array, but got:", events);
            return;
        }

        events.forEach((event, index) => {
            console.log(`🔍 Processing Event ${index + 1}:`, event);

            if (!event.event_date) {
                console.error(`❌ Missing event_date in Event ${index + 1}:`, event);
                return;
            }

            let eventDateUTC = new Date(event.event_date); // Convert from UTC
            if (isNaN(eventDateUTC)) {
                console.error(`❌ Invalid date format in Event ${index + 1}:`, event.event_date);
                return;
            }

            // ✅ Convert UTC date to Local time properly
            let eventDateLocal = new Date(eventDateUTC.getTime());
            let formattedDate = eventDateLocal.toLocaleDateString("en-CA"); // Format: YYYY-MM-DD

            console.log("📆 Stored UTC Date:", eventDateUTC.toISOString());
            console.log("✅ Adjusted Local Date for Display:", formattedDate);

            // Modify event object with corrected local date
            event.event_date = formattedDate;
        });
        showCalendar(currentMonth, currentYear); // 🛠️ Ensure the calendar is loaded first
        updateUIWithEvents(events);
        displaySavedDetails(events); // 🔹 Pass the updated events array correctly
    })
    .catch(error => console.error("❌ Error fetching events:", error));
}




function updateUIWithEvents(events) {
    bookedDays = {}; // Reset bookedDays

    events.forEach(event => {
        const eventDateKey = event.event_date.split("T")[0];  

        if (!bookedDays[eventDateKey]) {
            bookedDays[eventDateKey] = [];
        }
        
        bookedDays[eventDateKey].push({
            name: event.name,
            phone: event.phone,
            address: event.address,
            event_time: event.event_time,
            event: event.event,
            event_date: eventDateKey,  
        });
    });

    showCalendar(currentMonth, currentYear); // Refresh the calendar first!

    console.log("📌 Updated bookedDays:", bookedDays);

    Object.keys(bookedDays).forEach(eventDateKey => {
        let cell = document.querySelector(`td[data-date="${eventDateKey}"]`);
        if (cell) {
            console.log(`✅ Found cell for ${eventDateKey}`);
            cell.classList.add('booked-date');
            cell.setAttribute('title', `Booked: ${bookedDays[eventDateKey][0].name}, ${bookedDays[eventDateKey][0].event_time}`);
        } else {
            console.warn(`⚠️ No cell found for date: ${eventDateKey}`);
        }
    });
    
}



function displaySavedDetails(dateKey) {
    const savedDetailsContainer = document.getElementById("savedDetails");
    savedDetailsContainer.innerHTML = ""; 
    if (!dateKey || !Array.isArray(dateKey)) {
        console.error("❌ Invalid events data received:", dateKey);
        return;
    }
    dateKey.forEach((storedEvent,index) => {
        if (!storedEvent.event_date) {
            console.error(`❌ Event ${index + 1} is missing event_date:`, storedEvent);
            return;
        }
        

        // Convert stored event date to JS Date object
        let eventDate = new Date(storedEvent.event_date + "T00:00:00");
        if (isNaN(eventDate)) {
            console.error(`❌ Invalid date format in Event ${index + 1}:`, storedEvent.event_date);
            return;
        }
        
       
        let localDate = new Date(eventDate.getTime());

        console.log(`📆 Stored UTC Date for Event ${index + 1}:`, eventDate.toISOString());
        console.log(`✅ Adjusted Local Date for Display:`, localDate.toDateString());

        // Display event details
        const eventElement = document.createElement("div");
        eventElement.innerHTML = `
            <p><strong>Event:</strong> ${storedEvent.event}</p>
            <p><strong>Date:</strong> ${localDate.toDateString()}</p>
            <p><strong>Time:</strong> ${storedEvent.event_time}</p>
            <p><strong>Location:</strong> ${storedEvent.address}</p>
        `;
        savedDetailsContainer.appendChild(eventElement);
    });
    // Ensure the Add Event button works
    document.getElementById("addEventButton").onclick = function () {
        showAddEventForm();
    };

    document.getElementById("detailsModal").style.display = "block";
}



// Function to add an event
function addEvent(dateKey, eventData) {
    if (!bookedDays[dateKey]) {
        bookedDays[dateKey] = [];
    }
    bookedDays[dateKey].push(eventData);
    updateCalendar(dateKey); // Call this function to update the calendar view.
}

function showAddEventForm() {
    // Capture the selected date from the input
let selectedDate = document.getElementById("event_date").value;

// Convert it to UTC to avoid timezone issues
let correctedDate = new Date(selectedDate + "T00:00:00");

// Convert it back to a format that your backend accepts
let formattedDate = correctedDate.toISOString().split("T")[0]; 

console.log("📅 Original Date:", selectedDate);
console.log("✅ Corrected Date:", formattedDate);

    if (!selectedDateKey) {
        console.error("❌ No date selected for adding an event!");
        return;
    }

    console.log("📅 Selected date for event:", selectedDateKey);
    
    // Ensure correct format before storing
   
    document.getElementById("eventModal").style.display = "block"; // Show form
}


// Close the form when clicking the close button
document.getElementById("closeForm").onclick = function () {
    document.getElementById("eventModal").style.display = "none";
};


document.getElementById("closeForm").onclick = function () {
    document.getElementById("eventModal").style.display = "none";
};
function deleteEvent(dateKey, eventIndex) {
    const eventToDelete = bookedDays[dateKey][eventIndex];

    fetch('/delete-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateKey, eventId: eventToDelete.id })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Server Response:", data);
        
        if (data.success) {
            console.log("✅ Event deleted successfully from database");

            // Remove the deleted event from `bookedDays`
            bookedDays[dateKey].splice(eventIndex, 1);

            // If no more events on that date, remove the date from bookedDays
            if (bookedDays[dateKey].length === 0) {
                delete bookedDays[dateKey];  // Remove key from object
            }

            // Update the calendar UI immediately
            updateCalendarUI();

            // Update the modal view
            displaySavedDetails(dateKey);
        } else {
            console.error(" Failed to delete event. Server Response:", data);
        }
    })
    .catch(error => console.error("Error deleting event:", error));
}


function showNextEvent(dateKey, currentIndex) {
    const events = bookedDays[dateKey];
    const nextIndex = currentIndex + 1;

    if (!events || nextIndex >= events.length) {
        alert("No more events for this date.");
        return;
    }

    // Display the next event in a new modal
    openEventModal(dateKey, nextIndex);
}

function openEventModal(dateKey, eventIndex) {
    const detailsDiv = document.getElementById('savedDetails');
    const event = bookedDays[dateKey][eventIndex];

    if (!event) {
        alert("No more events available.");
        return;
    }

    detailsDiv.innerHTML = `
        <h3>Event Details for ${dateKey}</h3>
        <div class="event-details">
            <p><strong>Name:</strong> ${event.name}</p>
            <p><strong>Phone:</strong> ${event.phone}</p>
            <p><strong>Time:</strong> ${event.event_time}</p>
            <p><strong>Event:</strong> ${event.event}</p>
            <p><strong>Address:</strong> ${event.address}</p>
            <button class="delete-event" onclick="deleteEvent('${dateKey}', ${eventIndex})">Delete</button>
            <button class="show-next" onclick="showNextEvent('${dateKey}', ${eventIndex})">Show Next Event</button>
        </div>
    `;

    // Show modal
    const modal = document.getElementById('detailsModal');
    modal.style.display = 'block';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
}

// Function to update the calendar after adding or deleting events
function updateCalendar(dateKey) {
    const calendarElement = document.getElementById('calendar'); // Assuming you have a calendar container
    // Re-render your calendar to reflect the changes, or update the specific date's color
    // You will need a function that will change the appearance of the dates based on the events in the database.
}




function handleDateClick(selectedDate) {
    document.getElementById('event_date').value = selectedDate;
    document.getElementById('eventModal').style.display = 'block';
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

    
    if (event.target === eventModal) {
        eventModal.style.display = "none";  
    }
    
    
    if (event.target === detailsModal) {
        detailsModal.style.display = "none";  
    }
};

document.querySelectorAll('.calendar-day').forEach(day => {
    day.addEventListener('click', function () {
        let selectedDateKey = this.getAttribute('data-date');
        console.log(`📅 Date Clicked: ${selectedDateKey}`);
        displaySavedDetails(selectedDateKey);
    });
});





/*document.getElementById('downloadExcelBtn').addEventListener('click', function() {
    
    const eventsArray = [];

    
    for (let dateKey in savedData) {
        if (savedData.hasOwnProperty(dateKey)) {
            savedData[dateKey].forEach(event => {
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

    XLSX.writeFile(workbook, 'CalendarEvents.xlsx');
});*/


