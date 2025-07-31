// Firebase config - REPLACE with your own config below
const firebaseConfig = {
  apiKey: "AIzaSyAVmsiSzszfgCEk5qqnX57pGigoQtUafAU",
  authDomain: "food-tracker-fca47.firebaseapp.com",
  projectId: "food-tracker-fca47",
  storageBucket: "food-tracker-fca47.firebasestorage.app",
  messagingSenderId: "769456892190",
  appId: "1:769456892190:web:9c2a2e7d676f1f2d85010f",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM elements
const alimentiSection = document.getElementById('alimentiSection');
const temperatureSection = document.getElementById('temperatureSection');

const alimentiBtn = document.getElementById('alimentiBtn');
const temperatureBtn = document.getElementById('temperatureBtn');
const logoutBtn = document.getElementById('logoutBtn');

const foodForm = document.getElementById('foodForm');
const foodTableBody = document.querySelector('#foodTable tbody');
const sortSelect = document.getElementById('sortSelect');
const exportPdfBtn = document.getElementById('exportPdfBtn');

let editingId = null;

// Show Alimenti section
alimentiBtn.addEventListener('click', () => {
  alimentiSection.classList.remove('hidden');
  temperatureSection.classList.add('hidden');
});

// Show Temperature section
temperatureBtn.addEventListener('click', () => {
  temperatureSection.classList.remove('hidden');
  alimentiSection.classList.add('hidden');
});

// Logout button dummy (you can implement auth)
logoutBtn.addEventListener('click', () => {
  alert('Logout non implementato. Da integrare con Firebase Auth o altro.');
});

// Save or update alimento
foodForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Gather form data
  const data = foodForm.data.value;
  const prodotto = foodForm.prodotto.value.trim();
  const quantita = foodForm.quantita.value.trim();
  const processo = foodForm.processo.value;
  const scadenza = foodForm.scadenza.value;
  const sottovuotoRadio = foodForm.querySelector('input[name="sottovuoto"]:checked');
  const sottovuoto = sottovuotoRadio ? sottovuotoRadio.value : null;

  if (!data || !prodotto || !quantita || !processo || !scadenza || !sottovuoto) {
    alert("Compila tutti i campi obbligatori.");
    return;
  }

  const alimentoData = {
    data,
    prodotto,
    quantita,
    processo,
    scadenza,
    sottovuoto,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    if (editingId) {
      // Update existing
      await db.collection('alimenti').doc(editingId).update(alimentoData);
      editingId = null;
    } else {
      // Add new
      await db.collection('alimenti').add(alimentoData);
    }

    foodForm.reset();
    loadAlimenti();
  } catch (err) {
    console.error("Errore salvataggio alimento:", err);
  }
});

// Load alimenti from Firestore
async function loadAlimenti() {
  const snapshot = await db.collection('alimenti').get();

  let alimenti = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Sort based on sortSelect
  const sortBy = sortSelect.value;
  alimenti.sort((a, b) => {
    if (sortBy === 'data' || sortBy === 'scadenza') {
      return new Date(a[sortBy]) - new Date(b[sortBy]);
    } else {
      return a[sortBy].localeCompare(b[sortBy]);
    }
  });

  // Render table
  foodTableBody.innerHTML = '';

  const today = new Date();
  alimenti.forEach(alimento => {
    const scadenzaDate = new Date(alimento.scadenza);
    let tr = document.createElement('tr');

    // Mark expired or expiring soon
    const diffMs = scadenzaDate - today;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 0) {
      tr.classList.add('expired');
    } else if (diffDays <= 1) {
      tr.classList.add('expiring');
    }

    tr.innerHTML = `
      <td>${alimento.data}</td>
      <td>${alimento.prodotto}</td>
      <td>${alimento.quantita}</td>
      <td>${alimento.processo}</td>
      <td>${alimento.sottovuoto}</td>
      <td>${alimento.scadenza}</td>
      <td>
        <button class="action-btn edit-btn" data-id="${alimento.id}">Modifica</button>
        <button class="action-btn delete-btn" data-id="${alimento.id}">Elimina</button>
      </td>
    `;
    foodTableBody.appendChild(tr);
  });

  // Attach edit/delete listeners
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      startEditing(id);
    });
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (confirm("Sei sicuro di voler eliminare questo alimento?")) {
        await db.collection('alimenti').doc(id).delete();
        loadAlimenti();
      }
    });
  });
}

// Start editing an alimento
async function startEditing(id) {
  const doc = await db.collection('alimenti').doc(id).get();
  if (!doc.exists) return alert("Elemento non trovato!");

  const alimento = doc.data();
  editingId = id;

  foodForm.data.value = alimento.data;
  foodForm.prodotto.value = alimento.prodotto;
  foodForm.quantita.value = alimento.quantita;
  foodForm.processo.value = alimento.processo;
  foodForm.scadenza.value = alimento.scadenza;
  const radios = foodForm.querySelectorAll('input[name="sottovuoto"]');
  radios.forEach(radio => {
    radio.checked = (radio.value === alimento.sottovuoto);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Sort select change reload
sortSelect.addEventListener('change', loadAlimenti);

// Export to PDF
exportPdfBtn.addEventListener('click', () => {
  const element = document.getElementById('foodTable');
  const opt = {
    margin: 0.5,
    filename: 'alimenti.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' },
  };
  html2pdf().set(opt).from(element).save();
});

// Initial load
loadAlimenti();

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('change', () => {
  document.body.classList.toggle('dark', themeToggle.checked);
});
