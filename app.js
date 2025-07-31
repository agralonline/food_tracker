// Firebase config - replace with your own config
const firebaseConfig = {
  apiKey: "AIzaSyAVmsiSzszfgCEk5qqnX57pGigoQtUafAU",
  authDomain: "food-tracker-fca47.firebaseapp.com",
  projectId: "food-tracker-fca47",
  storageBucket: "food-tracker-fca47.firebasestorage.app",
  messagingSenderId: "769456892190",
  appId: "1:769456892190:web:9c2a2e7d676f1f2d85010f",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ELEMENTS
const alimentiSection = document.getElementById('alimentiSection');
const temperatureSection = document.getElementById('temperatureSection');
const alimentiBtn = document.getElementById('alimentiBtn');
const temperatureBtn = document.getElementById('temperatureBtn');
const logoutBtn = document.getElementById('logoutBtn');

const foodForm = document.getElementById('foodForm');
const foodTableBody = document.querySelector('#foodTable tbody');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const sortSelect = document.getElementById('sortSelect');

const areaSelect = document.getElementById('areaSelect');
const salaTable = document.getElementById('salaTable');
const cucinaTable = document.getElementById('cucinaTable');
const salaTableBody = document.getElementById('salaTableBody');
const cucinaTableBody = document.getElementById('cucinaTableBody');
const meseSalaSpan = document.getElementById('meseSala');
const annoSalaSpan = document.getElementById('annoSala');
const meseCucinaSpan = document.getElementById('meseCucina');
const annoCucinaSpan = document.getElementById('annoCucina');
const exportTempPdfBtn = document.getElementById('exportTempPdfBtn');

const themeToggle = document.getElementById('themeToggle');

let editId = null;
let currentArea = 'Sala'; // default temperature area
let user = null;

// --------- Authentication (simple example) -----------
function login(username, password) {
  // Simple hardcoded login - replace with real auth
  if (username === 'Admin' && password === 'Miraggio@46') {
    user = { username: 'Admin' };
    localStorage.setItem('user', JSON.stringify(user));
    showApp();
  } else {
    alert('Invalid credentials');
  }
}
function logout() {
  user = null;
  localStorage.removeItem('user');
  showLogin();
}

// Check if logged in
function checkAuth() {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user = JSON.parse(storedUser);
    showApp();
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('appSection').classList.add('hidden');
}
function showApp() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('appSection').classList.remove('hidden');
  loadFoodItems();
  loadTemperatureData();
  applyTheme();
}

// --------- Food Items Section ---------

function clearFoodForm() {
  foodForm.reset();
  editId = null;
  foodForm.querySelector('button[type="submit"]').textContent = 'Add Food Item';
  // Reset product dropdown if needed
  // No extra fields for now
}

function loadFoodItems() {
  if (!user) return;
  foodTableBody.innerHTML = '';
  db.collection('foodItems')
    .where('user', '==', user.username)
    .onSnapshot(snapshot => {
      const items = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      displayFoodItems(items);
    });
}

function displayFoodItems(items) {
  // Sort items by sortSelect
  const sortBy = sortSelect.value;
  items.sort((a, b) => {
    if (sortBy === 'expiry') {
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    } else if (sortBy === 'name') {
      return a.productName.localeCompare(b.productName);
    } else if (sortBy === 'prepared') {
      return new Date(a.preparedDate) - new Date(b.preparedDate);
    }
    return 0;
  });

  // Sort by expiry status: expired (red), expiring soon (yellow), fresh (normal)
  const now = new Date();
  const expired = items.filter(i => new Date(i.expiryDate) < now);
  const expiringSoon = items.filter(i => {
    const expiry = new Date(i.expiryDate);
    return expiry >= now && expiry <= new Date(now.getTime() + 24*3600*1000);
  });
  const fresh = items.filter(i => {
    const expiry = new Date(i.expiryDate);
    return expiry > new Date(now.getTime() + 24*3600*1000);
  });

  const sortedItems = [...expired, ...expiringSoon, ...fresh];

  foodTableBody.innerHTML = '';
  sortedItems.forEach(item => {
    const tr = document.createElement('tr');
    if (new Date(item.expiryDate) < now) {
      tr.style.backgroundColor = '#f8d7da'; // red-ish
    } else if (new Date(item.expiryDate) <= new Date(now.getTime() + 24*3600*1000)) {
      tr.style.backgroundColor = '#fff3cd'; // yellow-ish
    }
    tr.innerHTML = `
      <td>${item.productName}</td>
      <td>${item.preparedDate}</td>
      <td>${item.expiryDate}</td>
      <td>
        <button class="action-btn" data-id="${item.id}" data-action="edit">Edit</button>
        <button class="action-btn" data-id="${item.id}" data-action="delete">Delete</button>
      </td>
    `;
    foodTableBody.appendChild(tr);
  });
}

foodForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!user) return;

  const productName = foodForm.productName.value.trim();
  const preparedDate = foodForm.preparedDate.value;
  const expiryDate = foodForm.expiryDate.value;

  if (!productName || !preparedDate || !expiryDate) {
    alert('Please fill all fields');
    return;
  }

  if (editId) {
    // Update
    db.collection('foodItems').doc(editId).update({
      productName,
      preparedDate,
      expiryDate,
      user: user.username,
    }).then(() => {
      clearFoodForm();
    });
  } else {
    // Add new
    db.collection('foodItems').add({
      productName,
      preparedDate,
      expiryDate,
      user: user.username,
    }).then(() => {
      clearFoodForm();
    });
  }
});

foodTableBody.addEventListener('click', e => {
  if (e.target.classList.contains('action-btn')) {
    const id = e.target.dataset.id;
    const action = e.target.dataset.action;
    if (action === 'edit') {
      db.collection('foodItems').doc(id).get().then(doc => {
        if (doc.exists) {
          const data = doc.data();
          foodForm.productName.value = data.productName;
          foodForm.preparedDate.value = data.preparedDate;
          foodForm.expiryDate.value = data.expiryDate;
          editId = id;
          foodForm.querySelector('button[type="submit"]').textContent = 'Update Food Item';
        }
      });
    } else if (action === 'delete') {
      if (confirm('Delete this item?')) {
        db.collection('foodItems').doc(id).delete();
      }
    }
  }
});

// Export food items to PDF
exportPdfBtn.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Food Items List', 10, 20);

  let y = 30;
  db.collection('foodItems')
    .where('user', '==', user.username)
    .get()
    .then(snapshot => {
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        doc.setFontSize(12);
        doc.text(`Product: ${d.productName}`, 10, y);
        doc.text(`Prepared: ${d.preparedDate}`, 60, y);
        doc.text(`Expiry: ${d.expiryDate}`, 110, y);
        y += 10;
      });
      doc.save('food-items.pdf');
    });
});

// --------- Temperature Section ---------

// Month and year selectors for temperature logs
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');

function loadTemperatureData() {
  if (!user) return;
  updateTemperatureHeader();
  loadTemperatureTable();
}

function updateTemperatureHeader() {
  const month = monthSelect.value;
  const year = yearSelect.value;
  meseSalaSpan.textContent = month;
  annoSalaSpan.textContent = year;
  meseCucinaSpan.textContent = month;
  annoCucinaSpan.textContent = year;
}

function loadTemperatureTable() {
  if (!user) return;
  const month = monthSelect.value;
  const year = yearSelect.value;

  salaTableBody.innerHTML = '';
  cucinaTableBody.innerHTML = '';

  // Load Sala data
  db.collection('temperatureSala')
    .where('user', '==', user.username)
    .where('month', '==', month)
    .where('year', '==', year)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        // Initialize 31 days if empty
        for (let i = 1; i <= 31; i++) {
          db.collection('temperatureSala').add({
            day: i,
            month,
            year,
            ora: '',
            operatore: '',
            banco: '',
            bindi: '',
            cavallo: '',
            forno: '',
            user: user.username,
          });
        }
        loadTemperatureTable(); // reload after initialization
      } else {
        snapshot.forEach(doc => {
          addTempRow(salaTableBody, doc.id, doc.data());
        });
      }
    });

  // Load Cucina data
  db.collection('temperatureCucina')
    .where('user', '==', user.username)
    .where('month', '==', month)
    .where('year', '==', year)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        // Initialize 31 days if empty
        for (let i = 1; i <= 31; i++) {
          db.collection('temperatureCucina').add({
            day: i,
            month,
            year,
            ora: '',
            operatore: '',
            cucina1: '',
            cucina2: '',
            cucina3: '',
            forno: '',
            user: user.username,
          });
        }
        loadTemperatureTable(); // reload after initialization
      } else {
        snapshot.forEach(doc => {
          addTempRow(cucinaTableBody, doc.id, doc.data());
        });
      }
    });
}

function addTempRow(tbody, id, data) {
  const tr = document.createElement('tr');
  tr.dataset.id = id;

  if (tbody === salaTableBody) {
    tr.innerHTML = `
      <td>${data.day}</td>
      <td><input type="time" value="${data.ora}" data-field="ora"></td>
      <td><input type="text" value="${data.operatore}" data-field="operatore" autocomplete="off"></td>
      <td class="temp-cell-wrapper"><input type="text" value="${data.banco}" data-field="banco" autocomplete="off"><span class="deg-label">°C</span></td>
      <td class="temp-cell-wrapper"><input type="text" value="${data.bindi}" data-field="bindi" autocomplete="off"><span class="deg-label">°C</span></td>
      <td class="temp-cell-wrapper"><input type="text" value="${data.cavallo}" data-field="cavallo" autocomplete="off"><span class="deg-label">°C</span></td>
      <td class="temp-cell-wrapper"><input type="text" value="${data.forno}" data-field="forno" autocomplete="off"><span class="deg-label">°C</span></td>
    `;
  } else {
    tr.innerHTML = `
      <td>${data.day}</td>
      <td><input type="time" value="${data.ora}" data-field="ora"></td>
      <td><input type="text" value="${data.operatore}" data-field="operatore" autocomplete="off"></td>
      <td class="temp-cell-wrapper"><input type="text" value="${data.cucina1}" data-field="cucina1" autocomplete="off"><span class="deg-label">°C</span></td>
      <td class="temp-cell-wrapper"><input type="text" value="${data.cucina2}" data-field="cucina2" autocomplete="off"><span class="deg-label">°C</span></td>
      <td class="temp-cell-wrapper"><input type="text" value="${data.cucina3}" data-field="cucina3" autocomplete="off"><span class="deg-label">°C</span></td>
      <td class="temp-cell-wrapper"><input type="text" value="${data.forno}" data-field="forno" autocomplete="off"><span class="deg-label">°C</span></td>
    `;
  }

  tbody.appendChild(tr);
}

// Save temperature data on input change
function saveTemperatureData(e) {
  if (!user) return;
  const tr = e.target.closest('tr');
  if (!tr) return;
  const id = tr.dataset.id;
  const field = e.target.dataset.field;
  if (!id || !field) return;
  const value = e.target.value;

  const month = monthSelect.value;
  const year = yearSelect.value;

  const collectionName = tr.parentElement === salaTableBody ? 'temperatureSala' : 'temperatureCucina';

  db.collection(collectionName).doc(id).update({
    [field]: value,
    user: user.username,
    month,
    year,
  });
}

salaTableBody.addEventListener('input', saveTemperatureData);
cucinaTableBody.addEventListener('input', saveTemperatureData);

// Area select change
areaSelect.addEventListener('change', e => {
  currentArea = e.target.value;
  if (currentArea === 'Sala') {
    salaTable.classList.remove('hidden');
    cucinaTable.classList.add('hidden');
  } else {
    cucinaTable.classList.remove('hidden');
    salaTable.classList.add('hidden');
  }
});

// Month and year select change
monthSelect.addEventListener('change', () => {
  loadTemperatureTable();
  updateTemperatureHeader();
});
yearSelect.addEventListener('change', () => {
  loadTemperatureTable();
  updateTemperatureHeader();
});

// Export temperature PDF
exportTempPdfBtn.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(18);
  doc.text('Registro Controllo delle Temperature', 10, 15);
  const month = monthSelect.value;
  const year = yearSelect.value;
  doc.setFontSize(14);
  doc.text(`Mese: ${month}    Anno: ${year}`, 10, 25);

  const tableId = currentArea === 'Sala' ? 'salaTable' : 'cucinaTable';
  const table = document.getElementById(tableId);
  doc.autoTable({ html: `#${tableId}`, startY: 30 });
  doc.save(`registro_temperature_${currentArea.toLowerCase()}_${month}_${year}.pdf`);
});

// Theme toggle
function applyTheme() {
  if (themeToggle.checked) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
}
themeToggle.addEventListener('change', applyTheme);

// Initial setup
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  login(loginForm.username.value.trim(), loginForm.password.value);
});

logoutBtn.addEventListener('click', logout);

checkAuth();

applyTheme();
</script>

</body>
</html>
