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
let savedData = JSON.parse(localStorage.getItem('calendarEvents')) || {};

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
                    if (savedData[dateKey]) {
                        cell.classList.add("booked-date");
                        cell.onclick = () => displaySavedDetails(dateKey);
                        let eventDataList = savedData[dateKey];
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
                    } else {
                        cell.classList.add("disabled");
                        cell.setAttribute('title', 'Unavailable');
                        cell.onclick = null;
                    }
                } else {
                    cell.onclick = () => handleDateClick(dateKey);
                    cell.setAttribute('title', 'Available for booking');
                }

                
                if (savedData[dateKey]) {
                    cell.classList.add("booked-date");
                    let eventDataList = savedData[dateKey]; 
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
                } else {
                    cell.classList.remove("booked-date");  
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
    
    
    if (!savedData[dateValue]) {
        savedData[dateValue] = [];
    }

    
    savedData[dateValue].push({
        name: formData.get('name'), 
        phone: formData.get('phone'),
        address: formData.get('address'),
        event_time: formData.get('event_time'),
        event: formData.get('event'),
        event_date: dateValue  
    });

    localStorage.setItem('calendarEvents', JSON.stringify(savedData));
    showCalendar(currentMonth, currentYear);
    
    
    alert('Event saved successfully!');

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
        } else {
            alert('Error submitting form.');
        }
    })
    .catch(error => console.error('Error:', error));
});

function fetchEvents() {
    fetch('/get-events')
        .then(response => response.json())
        .then(data => {
            console.log('Fetched events:', data);
            updateUIWithEvents(data);
        })
        .catch(error => console.error('Error fetching events:', error));
}

function updateUIWithEvents(events) {
    events.forEach(event => {
        const eventDateKey = event.event_date; 

        
        if (!savedData[eventDateKey]) {
            savedData[eventDateKey] = []; 
        }

        
        savedData[eventDateKey].push({
            name: event.name,
            phone: event.phone,
            address: event.address,
            event_time: event.event_time,
            event_date: eventDateKey
        });

        let cell = document.querySelector(`td[data-date="${eventDateKey}"]`);
        if (cell) {
            cell.classList.add('booked-date'); 
        }
    });

   
    showCalendar(currentMonth, currentYear);
}


function deleteEvent(dateKey, phoneNumber, eventIndex) {
   
    if (!dateKey || !phoneNumber || eventIndex === undefined) {
        console.error('dateKey, phone number, and event index are required for deletion.');
        return;
    }

    
    if (savedData[dateKey]) {
        
        savedData[dateKey].splice(eventIndex, 1);
        
        
        if (savedData[dateKey].length === 0) {
            delete savedData[dateKey];
        }

   
        localStorage.setItem('calendarEvents', JSON.stringify(savedData));

     
        const detailsDiv = document.getElementById('savedDetails');
        detailsDiv.innerHTML = ''; 
        
       
        if (!savedData[dateKey] || savedData[dateKey].length === 0) {
            detailsDiv.style.display = 'none'; 
            
            
            const cell = document.querySelector(`td[data-date="${dateKey}"]`);
            if (cell) {
                cell.classList.remove('booked-date'); 
                cell.onclick = () => handleDateClick(dateKey); 
            }
        } else {
           
            displaySavedDetails(dateKey);
        }

       
        showCalendar(currentMonth, currentYear);

       
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


 

function displaySavedDetails(dateKey) {
    const detailsDiv = document.getElementById('savedDetails'); 
    let eventsData = savedData[dateKey];



if (!eventsData || eventsData.length === 0) {
    detailsDiv.innerHTML = `<h3>No events for ${dateKey}</h3>`;
    detailsDiv.style.display = 'block';
    return;
}


    detailsDiv.innerHTML = `<h3>Details for ${dateKey}</h3>`;
    let currentIndex = 0; 

    function showNextEvent() {
        
        detailsDiv.innerHTML = `<h3>Details for ${dateKey}</h3>`;

        
        eventsData = savedData[dateKey]; 

       
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

    detailsDiv.style.display = 'block';
}






showCalendar(currentMonth, currentYear);

function handleDateClick(selectedDate) {
    const detailsDiv = document.getElementById('savedDetails');
    if (savedData[selectedDate]) {
       
        if (detailsDiv.style.display === "block") {
            detailsDiv.style.display = "none";  
        } else {
            displaySavedDetails(selectedDate); 
            detailsDiv.style.display = "block";  
        }
    } else {
        document.getElementById('event_date').value = selectedDate; 
        document.getElementById('eventModal').style.display = 'block'; 
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

   
    if (event.target === eventModal) {
        eventModal.style.display = "none";  
    }
    
    
    if (event.target === detailsModal) {
        detailsModal.style.display = "none";  
    }
};

document.getElementById('downloadExcelBtn').onclick = function() {
    fetch('/get-events')
        .then(response => response.json())
        .then(data => generateExcel(data))
        .catch(error => console.error('Error fetching events for Excel:', error));
};

function generateExcel(events) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Events');


    worksheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Address', key: 'address', width: 30 },
        { header: 'Event Time', key: 'event_time', width: 20 },
        { header: 'Event Date', key: 'event_date', width: 15 },
        { header: 'Event', key: 'event', width: 30 }
    ];

    
    events.forEach(event => {
        worksheet.addRow({
            name: event.name,
            phone: event.phone,
            address: event.address,
            event_time: event.event_time,
            event_date: event.event_date,
            event: event.event
        });
    });

    
    workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'EventDetails.xlsx';
        link.click();
    });
}
