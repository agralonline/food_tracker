// Firebase config - REPLACE with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAVmsiSzszfgCEk5qqnX57pGigoQtUafAU",
  authDomain: "food-tracker-fca47.firebaseapp.com",
  projectId: "food-tracker-fca47",
  storageBucket: "food-tracker-fca47.firebasestorage.app",
  messagingSenderId: "769456892190",
  appId: "1:769456892190:web:9c2a2e7d676f1f2d85010f"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// DOM Elements
const loginSection = document.getElementById('loginSection');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

const appSection = document.getElementById('appSection');
const logoutBtn = document.getElementById('logoutBtn');

const productSelect = document.getElementById('productSelect');
const itemForm = document.getElementById('itemForm');
const datePreparedInput = document.getElementById('datePrepared');
const expiryDateInput = document.getElementById('expiryDate');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const itemsTableBody = document.querySelector('#itemsTable tbody');

let editingItemId = null;
let productsList = [];

// User credentials hardcoded for demo
const USERNAME = "Admin";
const PASSWORD = "Miraggio@46";

// --------- Authentication ---------
function showLogin(show) {
  if(show) {
    loginSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    logoutBtn.classList.add('hidden');
  } else {
    loginSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
  }
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if(username === USERNAME && password === PASSWORD){
    localStorage.setItem('loggedIn', 'true');
    loginError.textContent = '';
    showLogin(false);
    loadProducts();
    loadItems();
  } else {
    loginError.textContent = 'Username o password errati.';
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('loggedIn');
  location.reload();
});

// Check login status on page load
if(localStorage.getItem('loggedIn') === 'true'){
  showLogin(false);
  loadProducts();
  loadItems();
} else {
  showLogin(true);
}

// --------- Products (reusable dropdown) ---------
function loadProducts(){
  // Load products from Firestore collection 'products'
  db.collection('products').orderBy('name').get().then(snapshot => {
    productsList = [];
    productSelect.innerHTML = '<option value="" disabled selected>Seleziona prodotto</option>';
    snapshot.forEach(doc => {
      const product = doc.data();
      productsList.push(product.name);
      const option = document.createElement('option');
      option.value = product.name;
      option.textContent = product.name;
      productSelect.appendChild(option);
    });
  }).catch(err => {
    console.error("Errore caricamento prodotti:", err);
  });
}

// --------- Items (food tracking) ---------

function loadItems(){
  db.collection('items').orderBy('expiryDate').onSnapshot(snapshot => {
    const items = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      items.push({id: doc.id, ...data});
    });
    renderItems(items);
  }, err => {
    console.error("Errore caricamento items:", err);
  });
}

function renderItems(items){
  // Sort: expired first, then expiring soon, then fresh
  const now = new Date();
  const msInDay = 24*60*60*1000;

  items.sort((a,b) => {
    const aExp = new Date(a.expiryDate);
    const bExp = new Date(b.expiryDate);
    const aDiff = aExp - now;
    const bDiff = bExp - now;

    function priority(diff) {
      if(diff < 0) return 0;       // expired highest priority
      else if(diff <= msInDay) return 1; // expiring soon
      return 2;                    // fresh
    }
    const prioA = priority(aDiff);
    const prioB = priority(bDiff);

    if(prioA !== prioB) return prioA - prioB;
    return aExp - bExp; // if same priority, earlier expiry first
  });

  itemsTableBody.innerHTML = '';

  items.forEach(item => {
    const tr = document.createElement('tr');
    const expiry = new Date(item.expiryDate);
    const diff = expiry - now;

    // Highlight rows
    if(diff < 0){
      tr.classList.add('expired');
    } else if(diff <= msInDay){
      tr.classList.add('expiring-soon');
    }

    // Columns: product, datePrepared, expiryDate, actions
    tr.innerHTML = `
      <td>${item.product}</td>
      <td>${formatDate(item.datePrepared)}</td>
      <td>${formatDate(item.expiryDate)}</td>
      <td>
        <button class="action-btn" data-id="${item.id}" data-action="edit">Modifica</button>
        <button class="action-btn" data-id="${item.id}" data-action="delete">Elimina</button>
      </td>
    `;

    itemsTableBody.appendChild(tr);
  });

  // Attach event listeners for edit/delete buttons
  itemsTableBody.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', handleItemAction);
  });
}

function handleItemAction(e){
  const btn = e.currentTarget;
  const id = btn.getAttribute('data-id');
  const action = btn.getAttribute('data-action');

  if(action === 'edit'){
    startEditItem(id);
  } else if(action === 'delete'){
    if(confirm('Sei sicuro di voler eliminare questo elemento?')){
      db.collection('items').doc(id).delete();
    }
  }
}

function startEditItem(id){
  db.collection('items').doc(id).get().then(doc => {
    if(doc.exists){
      const data = doc.data();
      editingItemId = id;
      productSelect.value = data.product;
      datePreparedInput.value = data.datePrepared;
      expiryDateInput.value = data.expiryDate;
      submitBtn.textContent = 'Salva';
      cancelEditBtn.classList.remove('hidden');
    }
  });
}

cancelEditBtn.addEventListener('click', () => {
  resetForm();
});

itemForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const product = productSelect.value;
  const datePrepared = datePreparedInput.value;
  const expiryDate = expiryDateInput.value;

  if(!product || !datePrepared || !expiryDate){
    alert('Compila tutti i campi');
    return;
  }

  const itemData = {
    product,
    datePrepared,
    expiryDate
  };

  if(editingItemId){
    // Update
    db.collection('items').doc(editingItemId).set(itemData)
      .then(() => {
        resetForm();
      })
      .catch(err => alert('Errore aggiornamento: ' + err));
  } else {
    // Add new
    db.collection('items').add(itemData)
      .then(() => {
        resetForm();
      })
      .catch(err => alert('Errore aggiunta: ' + err));
  }
});

// Reset form to default state
function resetForm(){
  editingItemId = null;
  productSelect.value = '';
  datePreparedInput.value = '';
  expiryDateInput.value = '';
  submitBtn.textContent = 'Aggiungi';
  cancelEditBtn.classList.add('hidden');
}

// Format date dd/mm/yyyy
function formatDate(dateString){
  if(!dateString) return '';
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth()+1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
