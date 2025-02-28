const checkAvailabilityBtn = document.getElementById('checkAvailability');
const calendarModal = document.getElementById('calendarModal');
const closeModal = document.querySelector('.close');
const calendar = document.getElementById('calendar');
const sendRequestBtn = document.getElementById('sendRequest');
const monthYear = document.getElementById('monthYear');
const calendarBody = document.getElementById('calendarBody');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const selectedDatesDiv = document.getElementById('selectedDates');

let selectedDates = []; 
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); 


function generateCalendar(year, month) {
    const today = new Date();
    const todayDate = today.getDate(); 
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate(); 
    const dayOffset = (firstDay === 0) ? 6 : firstDay - 1; 

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthYear.textContent = `${monthNames[month]} ${year}`;

    
    calendarBody.innerHTML = '';

    
    let dateCount = 1;
    let row = document.createElement('tr');
    for (let i = 0; i < 7; i++) {
        let cell = document.createElement('td');
        if (i >= dayOffset) {
            cell.textContent = dateCount;
            cell.classList.add('day');

            const currentDate = new Date(year, month, dateCount);

            
            if (currentDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
                cell.classList.add('disabled'); 
            } else if (currentDate.toDateString() === today.toDateString()) {
                cell.classList.add('current');
            }

            
            const formattedDate = `${dateCount}-${month + 1}-${year}`;
            if (selectedDates.includes(formattedDate)) {
                cell.classList.add('selected'); 
            }

            dateCount++;
        }
        row.appendChild(cell);
    }
    calendarBody.appendChild(row);

    
    while (dateCount <= daysInMonth) {
        row = document.createElement('tr');
        for (let i = 0; i < 7; i++) {
            let cell = document.createElement('td');
            if (dateCount <= daysInMonth) {
                cell.textContent = dateCount;
                cell.classList.add('day');

                const currentDate = new Date(year, month, dateCount);

                
                if (currentDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
                    cell.classList.add('disabled'); 
                } else if (currentDate.toDateString() === today.toDateString()) {
                    cell.classList.add('current'); 
                }

                
                const formattedDate = `${dateCount}-${month + 1}-${year}`;
                if (selectedDates.includes(formattedDate)) {
                    cell.classList.add('selected'); 
                }

                dateCount++;
            } else {
                cell.textContent = '';
            }
            row.appendChild(cell);
        }
        calendarBody.appendChild(row);
    }

    const days = document.querySelectorAll('#calendarBody td.day');
    days.forEach(day => {
        if (!day.classList.contains('disabled')) { 
            day.addEventListener('click', function () {
                const selectedDate = `${day.innerText}-${month + 1}-${year}`; 

                if (selectedDates.includes(selectedDate)) {
                    selectedDates = selectedDates.filter(date => date !== selectedDate);
                    day.classList.remove('selected');
                } else {
                    if (selectedDates.length < 5) {
                        selectedDates.push(selectedDate);
                        day.classList.add('selected');
                    } else {
                        alert("You can only select a maximum of 5 dates.");
                    }
                }

                
                if (selectedDates.length > 0) {
                    selectedDatesDiv.innerText = `Selected Dates: ${selectedDates.join(', ')}`;
                    selectedDatesDiv.classList.remove('hidden');
                    sendRequestBtn.style.display = 'block';
                } else {
                    selectedDatesDiv.classList.add('hidden');
                    sendRequestBtn.style.display = 'none';
                }
            });
        }
    });

    
  
    if (year === today.getFullYear() && month <= today.getMonth()) {
        prevMonthBtn.style.display = 'none'; 
    } else {
        prevMonthBtn.style.display = 'block'; 
    }
}


prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    generateCalendar(currentYear, currentMonth);
});

nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    generateCalendar(currentYear, currentMonth);
});


checkAvailabilityBtn.addEventListener('click', function (event) {

    event.preventDefault();
    calendarModal.style.display = 'block'; 
    generateCalendar(currentYear, currentMonth); 
});


closeModal.addEventListener('click', function () {
    calendarModal.style.display = 'none'; 
});


window.addEventListener('click', function (event) {
    if (event.target == calendarModal) {
        calendarModal.style.display = 'none';
    }
});

function goto() {
    if (selectedDates.length > 0) {
        const queryParams = selectedDates.map((date, index) => `date${index + 1}=${encodeURIComponent(date)}`).join('&');
        window.location.href = `/form.html?${queryParams}`;
    }
}

