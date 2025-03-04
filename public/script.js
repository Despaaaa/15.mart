// Supabase client initialization
const supabaseUrl = 'https://srqtlqeehrnndtrohnaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycXRscWVlaHJubmR0cm9obmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNDY2NTQsImV4cCI6MjA1NjYyMjY1NH0.1E1GcqzSSjvuubkmC7eVpgjWlywrfB9rFTYlX6-CPhY';
const supabase = createClient(supabaseUrl, supabaseKey);

// University and Faculty Data
const universitiesData = {
    "University of Belgrade": [
        "Faculty of Economics",
        "Faculty of Law",
        "Faculty of Medicine",
        "Faculty of Philosophy",
        "Faculty of Technical Sciences",
        "Faculty of Architecture"
    ],
    "University of Novi Sad": [
        "Faculty of Technical Sciences",
        "Faculty of Economics",
        "Faculty of Medicine",
        "Faculty of Philosophy",
        "Faculty of Law"
    ],
    "University of Niš": [
        "Faculty of Electronic Engineering",
        "Faculty of Medicine",
        "Faculty of Economics",
        "Faculty of Law",
        "Faculty of Philosophy"
    ],
    "University of Kragujevac": [
        "Faculty of Engineering",
        "Faculty of Economics",
        "Faculty of Law",
        "Faculty of Medicine",
        "Faculty of Science"
    ],
    "Singidunum University": [
        "Faculty of Business",
        "Faculty of Informatics and Computing",
        "Faculty of Technical Sciences",
        "Faculty of Media and Communications"
    ],
    "Metropolitan University": [
        "Faculty of Information Technologies",
        "Faculty of Digital Arts",
        "Faculty of Management"
    ]
};

// Room data structure
const buildingData = {
    3: Array(10).fill().map(() => ({ 
        beds: Array(10).fill().map((_, i) => ({ 
            number: i + 1,
            reserved: false,
            studentName: null,
            studentId: null,
            university: null,
            faculty: null
        }))
    })),
    2: Array(10).fill().map(() => ({ 
        beds: Array(10).fill().map((_, i) => ({ 
            number: i + 1,
            reserved: false,
            studentName: null,
            studentId: null,
            university: null,
            faculty: null
        }))
    })),
    1: Array(10).fill().map(() => ({ 
        beds: Array(10).fill().map((_, i) => ({ 
            number: i + 1,
            reserved: false,
            studentName: null,
            studentId: null,
            university: null,
            faculty: null
        }))
    }))
};

let currentFloor = 3;
let selectedRoom = null;
let selectedBed = null;

// DOM Elements
const roomsGrid = document.getElementById('roomsGrid');
const floorButtons = document.querySelectorAll('.floor-btn');
const selectedRoomInfo = document.getElementById('selectedRoomInfo');
const confirmButton = document.getElementById('confirmReservation');
const modal = document.getElementById('reservationModal');
const closeBtn = document.querySelector('.close');
const universitySelect = document.getElementById('university');
const facultySelect = document.getElementById('faculty');
const reservationForm = document.getElementById('reservationForm');

// Initialize university dropdown
function initializeUniversities() {
    for (const university in universitiesData) {
        const option = document.createElement('option');
        option.value = university;
        option.textContent = university;
        universitySelect.appendChild(option);
    }
}

// Update faculties based on selected university
universitySelect.addEventListener('change', function() {
    const selectedUniversity = this.value;
    facultySelect.innerHTML = '<option value="">Select Faculty</option>';
    facultySelect.disabled = !selectedUniversity;

    if (selectedUniversity) {
        const faculties = universitiesData[selectedUniversity];
        faculties.forEach(faculty => {
            const option = document.createElement('option');
            option.value = faculty;
            option.textContent = faculty;
            facultySelect.appendChild(option);
        });
    }
});

// Initialize the rooms grid
function initializeRooms() {
    roomsGrid.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const roomNumber = `${currentFloor}${i.toString().padStart(2, '0')}`;
        const room = document.createElement('div');
        room.className = 'room';
        const roomData = buildingData[currentFloor][i - 1];
        const reservedBeds = roomData.beds.filter(bed => bed.reserved).length;
        
        room.innerHTML = `
            <div class="room-number">${roomNumber}</div>
            <div class="room-occupancy">${reservedBeds}/10 beds reserved</div>
            <div class="bed-grid">
                ${roomData.beds.map((bed, index) => `
                    <div class="bed ${bed.reserved ? 'reserved' : ''}" 
                         data-bed="${index + 1}"
                         title="${bed.reserved ? 'Reserved by: ' + bed.studentName : 'Available'}">
                        ${index + 1}
                    </div>
                `).join('')}
            </div>
        `;
        
        room.dataset.roomNumber = roomNumber;
        room.dataset.roomId = roomData.id;
        
        // Add click event listeners to beds instead of the whole room
        const bedElements = room.querySelectorAll('.bed');
        bedElements.forEach(bedElement => {
            if (!bedElement.classList.contains('reserved')) {
                bedElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectBed(room, parseInt(bedElement.dataset.bed));
                });
            }
        });
        
        roomsGrid.appendChild(room);
    }
}

// Handle floor selection
floorButtons.forEach(button => {
    button.addEventListener('click', async () => {
        floorButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentFloor = parseInt(button.dataset.floor);
        selectedRoom = null;
        selectedRoomInfo.innerHTML = '<p>No room selected</p>';
        confirmButton.disabled = true;
        
        showLoading();
        await initializeRoomsFromDB();
        hideLoading();
    });
});

// Handle bed selection
function selectBed(roomElement, bedNumber) {
    const roomNumber = roomElement.dataset.roomNumber;
    const floor = parseInt(roomNumber[0]);
    const roomIndex = parseInt(roomNumber.slice(1)) - 1;
    const roomData = buildingData[floor][roomIndex];
    const bed = roomData.beds[bedNumber - 1];

    if (bed.reserved) return;

    // Deselect previous bed
    if (selectedRoom) {
        selectedRoom.querySelectorAll('.bed').forEach(b => b.classList.remove('selected'));
    }

    // Select new bed
    selectedRoom = roomElement;
    selectedBed = bedNumber;
    roomElement.querySelector(`.bed[data-bed="${bedNumber}"]`).classList.add('selected');
    
    // Show modal
    modal.style.display = 'block';
    
    // Update room info
    selectedRoomInfo.innerHTML = `
        <p><strong>Selected Room:</strong> ${roomNumber}</p>
        <p><strong>Selected Bed:</strong> ${bedNumber}</p>
        <p><strong>Floor:</strong> ${floor}</p>
    `;
    
    confirmButton.disabled = false;
}

// Close modal and reset room selection
function closeModal() {
    modal.style.display = 'none';
    if (selectedRoom) {
        selectedRoom.querySelectorAll('.bed').forEach(b => b.classList.remove('selected'));
        selectedRoom = null;
    }
    selectedRoomInfo.innerHTML = '<p>No room selected</p>';
    confirmButton.disabled = true;
}

// Close modal when clicking the close button or outside the modal
closeBtn.addEventListener('click', closeModal);

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeModal();
    }
});

// Initialize rooms from Supabase
async function initializeRoomsFromDB() {
    try {
        const tableName = `floor_${currentFloor}`;
        
        // First, check if the floor has any records
        const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        // If no records exist for this floor, bulk insert all beds
        if (count === 0) {
            const bulkInsertData = [];
            for (let roomNum = 1; roomNum <= 10; roomNum++) {
                const roomNumber = `${currentFloor}${roomNum.toString().padStart(2, '0')}`;
                for (let bedNum = 1; bedNum <= 10; bedNum++) {
                    bulkInsertData.push({
                        room_number: roomNumber,
                        bed_number: bedNum,
                        is_reserved: false
                    });
                }
            }

            const { error: insertError } = await supabase
                .from(tableName)
                .insert(bulkInsertData);

            if (insertError) throw insertError;
        }

        // Fetch all data for current floor in a single query
        const { data: floorData, error } = await supabase
            .from(tableName)
            .select('*')
            .order('room_number')
            .order('bed_number');

        if (error) throw error;

        // Reset current floor data
        buildingData[currentFloor].forEach(room => {
            room.beds.forEach(bed => {
                bed.reserved = false;
                bed.studentName = null;
                bed.studentId = null;
                bed.university = null;
                bed.faculty = null;
            });
        });

        // Update building data with reservations
        floorData.forEach(record => {
            if (record.is_reserved) {
                const roomIndex = parseInt(record.room_number.slice(1)) - 1;
                const bedIndex = record.bed_number - 1;
                const bed = buildingData[currentFloor][roomIndex].beds[bedIndex];
                
                bed.reserved = true;
                bed.studentName = record.student_name;
                bed.studentId = record.student_id;
                bed.university = record.university;
                bed.faculty = record.faculty;
            }
        });

        // Initialize the rooms display
        initializeRooms();
    } catch (error) {
        console.error('Error loading reservations:', error);
        alert('Error loading reservations. Please try again later.');
    }
}

// Add loading indicator
function showLoading() {
    roomsGrid.innerHTML = '<div class="loading">Loading rooms...</div>';
}

function hideLoading() {
    const loadingElement = roomsGrid.querySelector('.loading');
    if (loadingElement) {
        loadingElement.remove();
    }
}

// Handle form submission with Supabase
async function handleReservation(formData) {
    try {
        const roomNumber = selectedRoom.dataset.roomNumber;
        const tableName = `floor_${currentFloor}`;

        // Update reservation in Supabase
        const { error } = await supabase
            .from(tableName)
            .update({
                student_name: formData.name,
                student_id: formData.studentId,
                university: formData.university,
                faculty: formData.faculty,
                is_reserved: true
            })
            .eq('room_number', roomNumber)
            .eq('bed_number', selectedBed);

        if (error) throw error;

        // Update local data
        const roomIndex = parseInt(roomNumber.slice(1)) - 1;
        const bed = buildingData[currentFloor][roomIndex].beds[selectedBed - 1];
        
        bed.reserved = true;
        bed.studentName = formData.name;
        bed.studentId = formData.studentId;
        bed.university = formData.university;
        bed.faculty = formData.faculty;

        // Show success message
        alert(`Bed ${selectedBed} in Room ${roomNumber} has been reserved for ${formData.name} (${formData.studentId})\nUniversity: ${formData.university}\nFaculty: ${formData.faculty}`);

        // Update UI
        closeModal();
        initializeRooms();
    } catch (error) {
        console.error('Error making reservation:', error);
        alert('Error making reservation. Please try again.');
    }
}

// Update the form submission handler
reservationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('studentName').value,
        studentId: document.getElementById('studentId').value,
        university: document.getElementById('university').value,
        faculty: document.getElementById('faculty').value
    };

    await handleReservation(formData);
    
    // Reset form
    reservationForm.reset();
    facultySelect.disabled = true;
});

// Add this CSS to your styles.css file
const style = document.createElement('style');
style.textContent = `
    .loading {
        text-align: center;
        padding: 20px;
        font-size: 18px;
        color: #666;
    }
`;
document.head.appendChild(style);

// Initialize the interface
initializeUniversities();
showLoading();
initializeRoomsFromDB().then(hideLoading); 