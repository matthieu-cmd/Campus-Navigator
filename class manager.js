const classListContainer = document.getElementById('class-list-container');
const addClassForm = document.getElementById('add-class-form');
const newClassCodeInput = document.getElementById('new-class-code');
const newClassNameInput = document.getElementById('new-class-name');

// Storage Helper Functions 
function loadClasses() {
    const classesJson = localStorage.getItem('userClasses');
    return classesJson ? JSON.parse(classesJson) : [];
}


function saveClasses(classes) {
    localStorage.setItem('userClasses', JSON.stringify(classes));
}


// Rendering Functions ---
function getLocationDetails(code) {
    // roomLookup is defined in index.html, which is accessible here
    return window.roomLookup ? window.roomLookup[code.toUpperCase()] : null;
}

//Renders the full list of saved classes into the modal.
function renderClassList() {
    const classes = loadClasses();
    classListContainer.innerHTML = ''; // Clear previous content

    if (classes.length === 0) {
        classListContainer.innerHTML = '<p style="text-align: center; color: #555;">No personalized classes saved.</p>';
        return;
    }

    classes.forEach(cls => {
        const roomData = getLocationDetails(cls.code);
        const locationText = roomData 
            ? `Location: ${roomData.building} (${roomData.floor})` 
            : '<span style="color: red;">Location not found in map data.</span>';
            
        const div = document.createElement('div');
        div.className = 'class-item';
        div.setAttribute('data-code', cls.code);

        div.innerHTML = `
            <div class="class-item-info">
                <strong>${cls.code}</strong> ${cls.name ? `(${cls.name})` : ''}
                <br><small>${locationText}</small>
            </div>
            <div class="class-item-actions">
                <button class="edit-btn" onclick="editClass('${cls.code}')">Edit</button>
                <button class="delete-btn" onclick="deleteClass('${cls.code}')">Delete</button>
            </div>
        `;
        classListContainer.appendChild(div);
    });
}

// CRUD Logic 

//Adds a new class to the list.
 
addClassForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const code = newClassCodeInput.value.trim().toUpperCase();
    const name = newClassNameInput.value.trim();

    if (!code) {
        alert('Class Code cannot be empty.');
        return;
    }

    if (!getLocationDetails(code)) {
         if (!confirm(`Warning: Room code ${code} was not found in the university map data. Continue anyway?`)) {
             return;
         }
    }

    const classes = loadClasses();
    if (classes.some(cls => cls.code === code)) {
        alert(`Class ${code} is already saved.`);
        return;
    }

    classes.push({ code, name });
    saveClasses(classes);

    // Clear form and refresh BOTH displays
    newClassCodeInput.value = '';
    newClassNameInput.value = '';
    
    // Refresh modal list
    renderClassList();
    
    // Also refresh the side panel immediately (if it's open)
    refreshAllClassDisplays();
});


function deleteClass(code) {
    if (!confirm(`Are you sure you want to delete the class ${code}?`)) {
        return;
    }

    let classes = loadClasses();
    classes = classes.filter(cls => cls.code !== code);
    saveClasses(classes);
    
    // Refresh both displays
    renderClassList();
    if (typeof refreshAllClassDisplays === 'function') {
        refreshAllClassDisplays();
    }
}


function editClass(oldCode) {
    let classes = loadClasses();
    const classToEdit = classes.find(cls => cls.code === oldCode);

    if (!classToEdit) return;

    const newCode = prompt(`Edit Class Code for ${oldCode}:`, classToEdit.code);
    if (newCode === null || !newCode.trim()) return;

    const newName = prompt(`Edit Friendly Name for ${oldCode}:`, classToEdit.name || '');
    if (newName === null) return;

    const newCodeUpper = newCode.trim().toUpperCase();

    // Check if new code conflicts with existing codes (unless it's the same class)
    if (newCodeUpper !== oldCode && classes.some(cls => cls.code === newCodeUpper)) {
        alert(`The new code ${newCodeUpper} is already in use.`);
        return;
    }
    
    // Update the object in the array
    classToEdit.code = newCodeUpper;
    classToEdit.name = newName;

    saveClasses(classes);
    
    // Refresh both displays
    renderClassList();
    if (typeof refreshAllClassDisplays === 'function') {
        refreshAllClassDisplays();
    }
}

// Attach functions to the global scope so they can be called from index.html (modal buttons)
window.loadClasses = loadClasses; 
window.renderClassList = renderClassList;
window.deleteClass = deleteClass;
window.editClass = editClass;

