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
                
                let currentDate = new Date(year, month, date);

                if (currentDate.toDateString() === today.toDateString()) {
                    cell.classList.add("today-date");
                }

                if (currentDate < today) {
                    cell.classList.add("past-date");
                    if (bookedDays[dateKey]) {
                       
                        cell.classList.add("booked-date");  
                        cell.onclick = () => displaySavedDetails(dateKey);
                        let eventDataList = bookedDays[dateKey];
                        if (eventDataList.length > 1) {
                            let tooltipText = '';
                            for (let i = 0; i < Math.min(eventDataList.length, 2); i++) {
                                let eventData = eventDataList[i];
                                tooltipText += `Booked ${i+1}: ${eventData.name}, ${eventData.event_time}, ${eventData.phone}\n`;
                            }
                            cell.setAttribute('title', tooltipText.trim());
                        } else {
                            let eventData = eventDataList[0];
                            cell.setAttribute('title', `Booked: ${eventData.name}, ${eventData.event_time}, ${eventData.phone}`);
                        }
                    
                          
                    } 
                    else {
                        cell.classList.add("disabled");
                        cell.setAttribute('title', 'Unavailable');
                    }
                }
                if (bookedDays[dateKey]) {
                    cell.classList.add("booked-date");
                    cell.onclick = () => displaySavedDetails(dateKey);
                    let eventDataList = bookedDays[dateKey]; 
                        if (eventDataList.length > 1) {
                            let tooltipText = '';
                            for (let i = 0; i < Math.min(eventDataList.length, 2); i++) {
                                let eventData = eventDataList[i];
                                tooltipText += `Booked ${i+1}: ${eventData.name}, ${eventData.event_time}, ${eventData.phone}\n`;
                            }
                            cell.setAttribute('title', tooltipText.trim());
                        } else {
                            let eventData = eventDataList[0];
                            cell.setAttribute('title', `Booked: ${eventData.name}, ${eventData.event_time}, ${eventData.phone}`);
                        }
                } 
                   
                
                
                else {
                    cell.classList.remove("booked-date");  
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
        

        if (!Array.isArray(events)) {
            console.error(" Expected an array, but got:", events);
            return;
        }

        events.forEach((event, index) => {
            console.log(`🔍 Processing Event ${index + 1}:`, event);

            if (!event.event_date) {
                console.error(` Missing event_date in Event ${index + 1}:`, event);
                return;
            }

            let eventDateUTC = new Date(event.event_date); // Convert from UTC
            if (isNaN(eventDateUTC)) {
                console.error(` Invalid date format in Event ${index + 1}:`, event.event_date);
                return;
            }

            // ✅ Convert UTC date to Local time properly
            let eventDateLocal = new Date(eventDateUTC.getTime());
            let formattedDate = eventDateLocal.toLocaleDateString("en-CA"); // Format: YYYY-MM-DD

            console.log(" Stored UTC Date:", eventDateUTC.toISOString());
            console.log(" Adjusted Local Date for Display:", formattedDate);

            // Modify event object with corrected local date
            event.event_date = formattedDate;
        });
        showCalendar(currentMonth, currentYear); 
        updateUIWithEvents(events);
        displaySavedDetails(events); // 🔹 Pass the updated events array correctly
    })
    .catch(error => console.error("Error fetching events:", error));
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

    showCalendar(currentMonth, currentYear); 

    console.log("Updated bookedDays:", bookedDays);

    Object.keys(bookedDays).forEach(eventDateKey => {
        let cell = document.querySelector(`td[data-date="${eventDateKey}"]`);
        if (cell) {
            console.log(` Found cell for ${eventDateKey}`);
            cell.classList.add('booked-date');
            cell.setAttribute('title', `Booked: ${bookedDays[eventDateKey][0].name}, ${bookedDays[eventDateKey][0].event_time}`);
        } else {
            console.warn(`No cell found for date: ${eventDateKey}`);
        }
    });
    
}



function displaySavedDetails(dateKey) {
    const detailsDiv = document.getElementById('savedDetails'); 
     let eventsData = bookedDays[dateKey];
     if (!eventsData || eventsData.length === 0) {
        detailsDiv.innerHTML = `<h3>No events for ${dateKey}</h3>`;
        detailsDiv.style.display = 'block';
        return;
     }
     detailsDiv.innerHTML = `<h3>Details for ${dateKey}</h3>`;
     let currentIndex = 0; 
     function showNextEvent() {
         
        detailsDiv.innerHTML = `<h3>Details for ${dateKey}</h3>`;
        if (currentIndex < eventsData.length) {
            const eventData = eventsData[currentIndex];
            detailsDiv.innerHTML += `
                <div class="event-details">
                    <p><strong>Name:</strong> ${eventData.name}</p>
                    <p><strong>Phone:</strong> ${eventData.phone}</p>
                    <p><strong>Address:</strong> ${eventData.address}</p>
                    <p><strong>Time:</strong> ${eventData.event_time}</p>
                    <p><strong>Date:</strong> ${eventData.event_date}</p>
                    <p><strong>Event:</strong> ${eventData.event}</p>
                    <button class="deleteEventBtn" data-index="${currentIndex}" data-phone="${eventData.phone}">Delete</button>
                    <button class="addEventBtn">Add</button>
                </div>
            `;

           
            document.getElementById('detailsModal').style.display = 'block';
            const deleteBtn = detailsDiv.querySelector('.deleteEventBtn');
        deleteBtn.onclick = function() {
            const phone = deleteBtn.getAttribute('data-phone'); 
            const index = parseInt(deleteBtn.getAttribute('data-index')); 
            deleteEvent(dateKey, phone, index); 
        };
        const addBtn = detailsDiv.querySelector('.addEventBtn');
    addBtn.onclick = function() {
            document.getElementById('detailsModal').style.display = 'none';  
            document.getElementById('event_date').value = dateKey;  
            document.getElementById('eventModal').style.display = 'block';  
        };
        
            currentIndex++; 
        } else {
            detailsDiv.innerHTML += `<p>No more events to show.</p>`;
        }
    }
        showNextEvent();
    const nextEventButton = document.createElement('button');
     nextEventButton.textContent = "Show Next Event";
     nextEventButton.onclick = showNextEvent;
     detailsDiv.appendChild(nextEventButton);
     
    
    document.getElementById("detailsModal").style.display = "block";
}


document.getElementById("closeForm").onclick = function () {
    document.getElementById("eventModal").style.display = "none";
};


document.getElementById("closeForm").onclick = function () {
    document.getElementById("eventModal").style.display = "none";
};


function deleteEvent(dateKey,phoneNumber, eventIndex) {
    if (!dateKey ||!phoneNumber|| eventIndex === undefined) {
        console.error('dateKey and event index are required for deletion.');
        return;
    }

    if (bookedDays[dateKey]) {
         
        bookedDays[dateKey].splice(eventIndex, 1);
        
        
        if (bookedDays[dateKey].length === 0) {
            delete bookedDays[dateKey];
        }
        const detailsDiv = document.getElementById('savedDetails');
        detailsDiv.innerHTML = ''; 
        if (!bookedDays[dateKey] || bookedDays[dateKey].length === 0) {
            detailsDiv.style.display = 'none'; 
            
            
            const cell = document.querySelector(`td[data-date="${dateKey}"]`);
            if (cell) {
                cell.classList.remove('booked-date'); 
                cell.onclick = () => handleDateClick(dateKey); 
            }
        } else {
           
            displaySavedDetails(dateKey);
        }
        fetch(`/delete-event?event_date=${encodeURIComponent(dateKey)}&phone=${encodeURIComponent(phoneNumber)}`, {
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
           
        });
    } else {
        console.error('No events found for this date.');
    }

}


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





document.getElementById('downloadExcelBtn').addEventListener('click', () => {
    fetch('/download-excel1')
        .then((response) => {
            if (!response.ok) throw new Error('Failed to download Excel file');
            return response.blob();
        })
        .then((blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'Booking.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url); // Clean up
        })
        .catch((error) => console.error('Error:', error));
});
