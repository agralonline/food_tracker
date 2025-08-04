// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAVmsiSzszfgCEk5qqnX57pGigoQtUafAU",
  authDomain: "food-tracker-fca47.firebaseapp.com",
  projectId: "food-tracker-fca47",
  storageBucket: "food-tracker-fca47.firebasestorage.app",
  messagingSenderId: "769456892190",
  appId: "1:769456892190:web:9c2a2e7d676f1f2d85010f"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const foodForm = document.getElementById('foodForm');
const foodTableBody = document.querySelector('#foodTable tbody');
const exportAlimentiBtn = document.getElementById('exportAlimentiBtn');
const sortBy = document.getElementById('sortBy');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const prodottoList = document.getElementById('prodottoList');
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

let editingId = null;
let allItems = [];
let sortField = 'scadenza';
let sortAsc = true;

// Set default date to today for "data"
function setDefaultToday() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  foodForm.data.value = `${yyyy}-${mm}-${dd}`;
}
setDefaultToday();

function formatDate(dateStr){
  if(!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('it-IT');
}

function resetForm(){
  foodForm.reset();
  editingId = null;
  setDefaultToday();
  foodForm.querySelector('button[type=submit]').textContent = 'Aggiungi';
  cancelEditBtn.style.display = 'none';
}

function getUniqueProducts(items) {
  const set = new Set();
  items.forEach(i => {
    if (i.prodotto && i.prodotto.trim()) set.add(i.prodotto.trim());
  });
  return Array.from(set).sort();
}

function fillProductDatalist(items) {
  prodottoList.innerHTML = "";
  getUniqueProducts(items).forEach(prod => {
    const opt = document.createElement("option");
    opt.value = prod;
    prodottoList.appendChild(opt);
  });
}

function renderItems(items){
  // sort items based on sortField & sortAsc
  items.sort((a, b) => {
    let av = a[sortField] || "";
    let bv = b[sortField] || "";
    if(sortField === 'scadenza' || sortField === 'data'){
      av = av || "9999-12-31"; // always last if missing
      bv = bv || "9999-12-31";
      if (av !== bv) return (sortAsc ? av.localeCompare(bv) : bv.localeCompare(av));
    } else {
      if (av.toLowerCase() !== bv.toLowerCase())
        return (sortAsc ? av.toLowerCase().localeCompare(bv.toLowerCase()) : bv.toLowerCase().localeCompare(av.toLowerCase()));
    }
    return 0;
  });

  foodTableBody.innerHTML = '';
  const now = new Date();
  const msInDay = 24*60*60*1000;
  items.forEach(item => {
    const tr = document.createElement('tr');
    const expiry = new Date(item.scadenza);
    const diff = expiry - now;
    if(diff < 0){
      tr.classList.add('expired');
    } else if(diff <= msInDay){
      tr.classList.add('expiring');
    }

    tr.innerHTML = `
      <td>${formatDate(item.data)}</td>
      <td>${item.prodotto || ''}</td>
      <td>${item.quantita || ''}</td>
      <td>${item.processo || ''}</td>
      <td>${formatDate(item.scadenza)}</td>
      <td>${item.sottovuoto || ''}</td>
      <td>
        <button class="edit-btn" data-id="${item.id}">✏️</button>
        <button class="delete-btn" data-id="${item.id}">🗑️</button>
      </td>
    `;
    foodTableBody.appendChild(tr);
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => startEdit(btn.dataset.id);
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => {
      if(confirm('Sei sicuro di voler eliminare questo elemento?')){
        db.collection('items').doc(btn.dataset.id).delete();
      }
    }
  });
}

function startEdit(id){
  db.collection('items').doc(id).get().then(doc => {
    if(doc.exists){
      const data = doc.data();
      editingId = id;
      foodForm.data.value = data.data;
      foodForm.prodotto.value = data.prodotto || '';
      foodForm.quantita.value = data.quantita || '';
      foodForm.processo.value = data.processo || '';
      foodForm.scadenza.value = data.scadenza || '';
      foodForm.sottovuoto.value = data.sottovuoto || '';
      foodForm.querySelector('button[type=submit]').textContent = 'Salva';
      cancelEditBtn.style.display = '';
    }
  });
}

db.collection('items').onSnapshot(snapshot => {
  allItems = [];
  snapshot.forEach(doc => {
    allItems.push({id: doc.id, ...doc.data()});
  });
  fillProductDatalist(allItems);
  renderItems(allItems);
});

foodForm.addEventListener('submit', e => {
  e.preventDefault();
  const newItem = {
    data: foodForm.data.value,
    prodotto: foodForm.prodotto.value.trim(),
    quantita: foodForm.quantita.value.trim(),
    processo: foodForm.processo.value,
    scadenza: foodForm.scadenza.value,
    sottovuoto: foodForm.sottovuoto.value
  };

  if (!newItem.sottovuoto || !newItem.processo) {
    alert("Seleziona un'opzione per 'Processo' e 'Sottovuoto'");
    return;
  }

  if(editingId){
    db.collection('items').doc(editingId).update(newItem).then(resetForm);
  } else {
    db.collection('items').add(newItem).then(resetForm);
  }
});

cancelEditBtn.onclick = resetForm;

// Sorting functionality
sortBy.addEventListener('change', () => {
  sortField = sortBy.value;
  sortAsc = true;
  renderItems(allItems);
});

// Reverse sort if same sort selected again
sortBy.addEventListener('dblclick', () => {
  sortAsc = !sortAsc;
  renderItems(allItems);
});

exportAlimentiBtn.onclick = () => {
  const doc = new window.jspdf.jsPDF();
  doc.text('Elenco Alimenti', 14, 20);
  const rows = [];
  foodTableBody.querySelectorAll('tr').forEach(tr => {
    const row = [];
    tr.querySelectorAll('td').forEach((td, idx) => {
      if (idx < 6) row.push(td.textContent.trim());
    });
    if(row.length) rows.push(row);
  });

  doc.autoTable({
    head: [['Data', 'Prodotto', 'Quantità', 'Processo', 'Scadenza', 'Sottovuoto']],
    body: rows,
    startY: 30
  });

  doc.save('elenco-alimenti.pdf');
};

// Theme toggle
themeToggle.onclick = () => {
  body.classList.toggle('dark-mode');
  if(body.classList.contains('dark-mode')){
    localStorage.setItem('theme', 'dark');
  } else {
    localStorage.setItem('theme', 'light');
  }
};
if(localStorage.getItem('theme') === 'dark'){
  body.classList.add('dark-mode');
}
