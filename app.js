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

// DOM Elements
const alimentiSection = document.getElementById('alimentiSection');
const foodForm = document.getElementById('foodForm');
const foodTableBody = document.querySelector('#foodTable tbody');
const exportAlimentiBtn = document.getElementById('exportAlimentiBtn');

const alimentiBtn = document.getElementById('alimentiBtn');
const temperatureBtn = document.getElementById('temperatureBtn');
const temperatureSection = document.getElementById('temperatureSection');

const themeToggle = document.getElementById('themeToggle');
const body = document.body;

let editingId = null;

function formatDate(dateStr){
  if(!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('it-IT');
}

function resetForm(){
  foodForm.reset();
  editingId = null;
  foodForm.querySelector('button[type=submit]').textContent = 'Aggiungi';
}

function renderItems(items){
  const now = new Date();
  const msInDay = 24*60*60*1000;

  // Sort: expired first, then expiring soon, then fresh
  items.sort((a,b) => {
    const aExp = new Date(a.scadenza);
    const bExp = new Date(b.scadenza);
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
    return aExp - bExp;
  });

  foodTableBody.innerHTML = '';
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
      <td>${item.prodotto}</td>
      <td>${item.quantita || ''}</td>
      <td>${item.processo || ''}</td>
      <td>${formatDate(item.scadenza)}</td>
      <td>
        <button class="edit-btn" data-id="${item.id}">Modifica</button>
        <button class="delete-btn" data-id="${item.id}">Elimina</button>
      </td>
    `;
    foodTableBody.appendChild(tr);
  });

  // Add event listeners for edit and delete buttons
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
      foodForm.prodotto.value = data.prodotto;
      foodForm.quantita.value = data.quantita || '';
      foodForm.processo.value = data.processo || '';
      foodForm.scadenza.value = data.scadenza;
      foodForm.querySelector('button[type=submit]').textContent = 'Salva';
    }
  });
}

// Load items and listen for changes realtime
db.collection('items').onSnapshot(snapshot => {
  const items = [];
  snapshot.forEach(doc => {
    items.push({id: doc.id, ...doc.data()});
  });
  renderItems(items);
});

// Handle form submit
foodForm.addEventListener('submit', e => {
  e.preventDefault();
  const newItem = {
    data: foodForm.data.value,
    prodotto: foodForm.prodotto.value.trim(),
    quantita: foodForm.quantita.value.trim(),
    processo: foodForm.processo.value.trim(),
    scadenza: foodForm.scadenza.value
  };

  if(editingId){
    db.collection('items').doc(editingId).update(newItem).then(() => {
      resetForm();
    });
  } else {
    db.collection('items').add(newItem).then(() => {
      resetForm();
    });
  }
});

// Export PDF for Alimenti
exportAlimentiBtn.onclick = () => {
  import('jspdf').then(jsPDFModule => {
    const { jsPDF } = jsPDFModule;
    const doc = new jsPDF();

    doc.text('Elenco Alimenti', 14, 20);
    const rows = [];
    foodTableBody.querySelectorAll('tr').forEach(tr => {
      const row = [];
      tr.querySelectorAll('td').forEach(td => {
        if(td.textContent) row.push(td.textContent.trim());
      });
      if(row.length) rows.push(row);
    });

    doc.autoTable({
      head: [['Data', 'Prodotto', 'Quantità', 'Processo', 'Scadenza']],
      body: rows,
      startY: 30
    });

    doc.save('elenco-alimenti.pdf');
  });
};

// Toggle sections
alimentiBtn.onclick = () => {
  alimentiSection.classList.remove('hidden');
  temperatureSection.classList.add('hidden');
};
temperatureBtn.onclick = () => {
  alimentiSection.classList.add('hidden');
  temperatureSection.classList.remove('hidden');
};

// Dark mode toggle
themeToggle.onclick = () => {
  body.classList.toggle('dark-mode');
  // Save preference
  if(body.classList.contains('dark-mode')){
    localStorage.setItem('theme', 'dark');
  } else {
    localStorage.setItem('theme', 'light');
  }
};

// Load theme preference on start
if(localStorage.getItem('theme') === 'dark'){
  body.classList.add('dark-mode');
}
