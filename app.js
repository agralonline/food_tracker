// Your Firebase config (compat version)
const firebaseConfig = {
  apiKey: "AIzaSyCMPJV-Y_HG8rWClHS7F84ZdBjEUH8B4O0",
  authDomain: "alimenti-temperature.firebaseapp.com",
  projectId: "alimenti-temperature",
  storageBucket: "alimenti-temperature.firebasestorage.app",
  messagingSenderId: "541143546651",
  appId: "1:541143546651:web:a5a05c8cf5a82f867531be"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const loginForm = document.getElementById('loginForm');
const appDiv = document.getElementById('app');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

const foodForm = document.getElementById('foodForm');
const foodTableBody = document.querySelector('#foodTable tbody');
const exportPdfBtn = document.getElementById('exportPdfBtn');

// Fixed credentials
const VALID_USERNAME = 'Admin';
const VALID_PASSWORD = 'Miraggio@46';

// Store current editing doc id (null means new add)
let editingDocId = null;

// On load, check if user is logged in via sessionStorage
if (sessionStorage.getItem('loggedIn') === 'true') {
  showApp();
} else {
  showLogin();
}

loginBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    sessionStorage.setItem('loggedIn', 'true');
    showApp();
  } else {
    loginError.style.display = 'block';
  }
});

logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem('loggedIn');
  location.reload();
});

function showLogin() {
  loginForm.style.display = 'block';
  appDiv.style.display = 'none';
  loginError.style.display = 'none';
  usernameInput.value = '';
  passwordInput.value = '';
}

function showApp() {
  loginForm.style.display = 'none';
  appDiv.style.display = 'block';
  loadItemsFromFirestore();
}

// Set today's date for Data and Scadenza fields
function setTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const formatted = `${yyyy}-${mm}-${dd}`;
  document.getElementById('data').value = formatted;
  document.getElementById('scadenza').value = formatted;
}

// Call on app show
setTodayDate();

foodForm.addEventListener('submit', async e => {
  e.preventDefault();

  const data = document.getElementById('data').value;
  const prodotto = document.getElementById('prodotto').value.trim();
  const quantita = document.getElementById('quantita').value;
  const processo = document.getElementById('processo').value;
  const scadenza = document.getElementById('scadenza').value;

  if (!data || !prodotto || !quantita || !processo || !scadenza) {
    alert('Compila tutti i campi obbligatori.');
    return;
  }

  const itemData = { data, prodotto, quantita: Number(quantita), processo, scadenza };

  try {
    if (editingDocId) {
      // Update existing
      await db.collection('alimenti').doc(editingDocId).update(itemData);
      editingDocId = null;
      foodForm.querySelector('button[type="submit"]').textContent = 'Aggiungi';
    } else {
      // Add new
      await db.collection('alimenti').add(itemData);
    }
    foodForm.reset();
    setTodayDate();
  } catch (error) {
    alert('Errore salvataggio: ' + error.message);
  }
});

// Load items realtime from Firestore
function loadItemsFromFirestore() {
  db.collection('alimenti').orderBy('scadenza').onSnapshot(snapshot => {
    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    renderTable(items);
  });
}

// Render table with sorting capability
let currentSortKey = 'scadenza';
let sortAsc = true;

function renderTable(items) {
  // Sort items by current sort key
  items.sort((a, b) => {
    let valA = a[currentSortKey];
    let valB = b[currentSortKey];
    if (currentSortKey === 'quantita') {
      valA = Number(valA);
      valB = Number(valB);
    } else {
      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();
    }
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  foodTableBody.innerHTML = '';
  items.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.data}</td>
      <td>${item.prodotto}</td>
      <td>${item.quantita}</td>
      <td>${item.processo}</td>
      <td>${item.scadenza}</td>
      <td>
        <button class="action-btn edit" data-id="${item.id}">Modifica</button>
        <button class="action-btn delete" data-id="${item.id}">Elimina</button>
      </td>
    `;
    foodTableBody.appendChild(tr);
  });

  // Attach edit/delete event handlers
  document.querySelectorAll('.action-btn.edit').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      editItem(id);
    };
  });
  document.querySelectorAll('.action-btn.delete').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Sei sicuro di voler eliminare questo elemento?')) {
        deleteItem(id);
      }
    };
  });
}

// Edit item: load data in form
async function editItem(id) {
  try {
    const doc = await db.collection('alimenti').doc(id).get();
    if (doc.exists) {
      const data = doc.data();
      document.getElementById('data').value = data.data;
      document.getElementById('prodotto').value = data.prodotto;
      document.getElementById('quantita').value = data.quantita;
      document.getElementById('processo').value = data.processo;
      document.getElementById('scadenza').value = data.scadenza;
      editingDocId = id;
      foodForm.querySelector('button[type="submit"]').textContent = 'Aggiorna';
    }
  } catch (error) {
    alert('Errore recupero elemento: ' + error.message);
  }
}

// Delete item from Firestore
async function deleteItem(id) {
  try {
    await db.collection('alimenti').doc(id).delete();
  } catch (error) {
    alert('Errore eliminazione: ' + error.message);
  }
}

// Sorting on table headers
document.querySelectorAll('#foodTable th[data-sort]').forEach(th => {
  th.style.userSelect = 'none';
  th.onclick = () => {
    const key = th.getAttribute('data-sort');
    if (currentSortKey === key) {
      sortAsc = !sortAsc;
    } else {
      currentSortKey = key;
      sortAsc = true;
    }
    loadItemsFromFirestore(); // Reload to trigger re-render
  };
});

// Export to PDF
exportPdfBtn.onclick = () => {
  const element = document.getElementById('foodTable');
  html2pdf().from(element).set({ margin:1, filename:'alimenti.pdf', html2canvas: { scale:2 } }).save();
};
