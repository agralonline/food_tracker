// Firebase config — REPLACE with your config:
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

// DOM Elements
const alimentiBtn = document.getElementById('alimentiBtn');
const temperatureBtn = document.getElementById('temperatureBtn');
const alimentiSection = document.getElementById('alimentiSection');
const temperatureSection = document.getElementById('temperatureSection');
const foodForm = document.getElementById('foodForm');
const foodTableBody = document.querySelector('#foodTable tbody');
const sortSelect = document.getElementById('sortSelect');
const exportAlimentiBtn = document.getElementById('exportAlimentiBtn');

const areaSelect = document.getElementById('areaSelect');
const salaTable = document.getElementById('salaTable');
const cucinaTable = document.getElementById('cucinaTable');
const salaTableBody = document.getElementById('salaTableBody');
const cucinaTableBody = document.getElementById('cucinaTableBody');
const exportSalaBtn = document.getElementById('exportSalaBtn');
const exportCucinaBtn = document.getElementById('exportCucinaBtn');

const meseSalaSpan = document.getElementById('meseSala');
const annoSalaSpan = document.getElementById('annoSala');
const meseCucinaSpan = document.getElementById('meseCucina');
const annoCucinaSpan = document.getElementById('annoCucina');

const themeToggleBtn = document.getElementById('themeToggle');

let foodData = [];
let editId = null;

// Theme toggle
themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
});

// Show Alimenti
alimentiBtn.addEventListener('click', () => {
  alimentiSection.classList.remove('hidden');
  temperatureSection.classList.add('hidden');
});

// Show Temperature
temperatureBtn.addEventListener('click', () => {
  alimentiSection.classList.add('hidden');
  temperatureSection.classList.remove('hidden');
  updateTemperatureArea();
});

// Food Form Submit
foodForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = document.getElementById('data').value;
  const prodotto = document.getElementById('prodotto').value.trim();
  const quantita = document.getElementById('quantita').value.trim();
  const processo = document.getElementById('processo').value.trim();
  const scadenza = document.getElementById('scadenza').value;

  if (!data || !prodotto || !scadenza) {
    alert('Compila tutti i campi obbligatori');
    return;
  }

  const item = { data, prodotto, quantita, processo, scadenza };

  try {
    if (editId) {
      await db.collection('alimenti').doc(editId).set(item);
      editId = null;
      foodForm.querySelector('button[type="submit"]').textContent = 'Aggiungi Alimento';
    } else {
      await db.collection('alimenti').add(item);
    }
    foodForm.reset();
  } catch (err) {
    alert('Errore salvataggio: ' + err.message);
  }
});

// Load Food Data from Firebase and Listen for changes
db.collection('alimenti').onSnapshot((snapshot) => {
  foodData = [];
  snapshot.forEach(doc => {
    foodData.push({ id: doc.id, ...doc.data() });
  });
  renderFoodTable();
});

// Render Food Table
function renderFoodTable() {
  const sortBy = sortSelect.value;

  foodData.sort((a, b) => {
    if (sortBy === 'data' || sortBy === 'scadenza') {
      return new Date(a[sortBy]) - new Date(b[sortBy]);
    }
    if (sortBy === 'prodotto' || sortBy === 'processo') {
      return a[sortBy].localeCompare(b[sortBy]);
    }
    return 0;
  });

  // Expired items first, then expiring soon, then others
  foodData.sort((a, b) => {
    const now = new Date();
    const aScad = new Date(a.scadenza);
    const bScad = new Date(b.scadenza);
    const aExpired = aScad < now;
    const bExpired = bScad < now;
    if (aExpired && !bExpired) return -1;
    if (!aExpired && bExpired) return 1;
    // check expiring within 24h
    const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const aSoon = aScad >= now && aScad <= nextDay;
    const bSoon = bScad >= now && bScad <= nextDay;
    if (aSoon && !bSoon) return -1;
    if (!aSoon && bSoon) return 1;
    return 0;
  });

  foodTableBody.innerHTML = '';
  foodData.forEach(item => {
    const tr = document.createElement('tr');
    const now = new Date();
    const scadDate = new Date(item.scadenza);

    if (scadDate < now) {
      tr.classList.add('expired');
    } else if (scadDate <= new Date(now.getTime() + 24*3600*1000)) {
      tr.classList.add('expiring');
    }

    tr.innerHTML = `
      <td>${formatDateIT(item.data)}</td>
      <td>${item.prodotto}</td>
      <td>${item.quantita || ''}</td>
      <td>${item.processo || ''}</td>
      <td>${formatDateIT(item.scadenza)}</td>
      <td>
        <button class="editBtn" data-id="${item.id}">✏️</button>
        <button class="deleteBtn" data-id="${item.id}">🗑️</button>
      </td>
    `;

    foodTableBody.appendChild(tr);
  });

  // Edit buttons
  document.querySelectorAll('.editBtn').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const doc = await db.collection('alimenti').doc(id).get();
      const data = doc.data();

      document.getElementById('data').value = data.data;
      document.getElementById('prodotto').value = data.prodotto;
      document.getElementById('quantita').value = data.quantita || '';
      document.getElementById('processo').value = data.processo || '';
      document.getElementById('scadenza').value = data.scadenza;

      editId = id;
      foodForm.querySelector('button[type="submit"]').textContent = 'Salva Modifica';
    };
  });

  // Delete buttons
  document.querySelectorAll('.deleteBtn').forEach(btn => {
    btn.onclick = async () => {
      if (confirm('Sei sicuro di voler eliminare questo alimento?')) {
        await db.collection('alimenti').doc(btn.dataset.id).delete();
      }
    };
  });
}

// Format date Italian (dd/mm/yyyy)
function formatDateIT(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('it-IT');
}

// Sort select change
sortSelect.addEventListener('change', renderFoodTable);

// PDF export for Alimenti
exportAlimentiBtn.addEventListener('click', () => {
  import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js').then(({ jsPDF }) => {
    const doc = new jsPDF.jsPDF();
    doc.setFontSize(16);
    doc.text("Elenco Alimenti", 14, 20);
    const columns = ["Data", "Prodotto", "Quantità", "Processo", "Scadenza"];
    const rows = foodData.map(item => [
      formatDateIT(item.data),
      item.prodotto,
      item.quantita || '',
      item.processo || '',
      formatDateIT(item.scadenza)
    ]);
    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 30,
    });
    doc.save("alimenti.pdf");
  });
});

// Temperature Area selection
areaSelect.addEventListener('change', updateTemperatureArea);

function updateTemperatureArea() {
  if (areaSelect.value === 'sala') {
    salaTable.classList.remove('hidden');
    cucinaTable.classList.add('hidden');
  } else {
    salaTable.classList.add('hidden');
    cucinaTable.classList.remove('hidden');
  }
  loadTemperatureTables();
}

// Load Temperature tables data from Firebase and initialize if empty
async function loadTemperatureTables() {
  const today = new Date();
  const mese = today.getMonth() + 1; // 1-12
  const anno = today.getFullYear();

  meseSalaSpan.textContent = mese.toString().padStart(2, '0');
  annoSalaSpan.textContent = anno;
  meseCucinaSpan.textContent = mese.toString().padStart(2, '0');
  annoCucinaSpan.textContent = anno;

  // Load Sala data
  const salaDoc = await db.collection('temperature').doc('sala').get();
  if (!salaDoc.exists) {
    // Initialize 31 rows with empty data
    const initialSala = {};
    for (let g = 1; g <= 31; g++) {
      initialSala[g] = {
        giorno: g,
        ora: '',
        operatore: '',
        banco: '',
        bindi: '',
        vetrinetta: '',
        levissima: '',
        cantinaVini: ''
      };
    }
    await db.collection('temperature').doc('sala').set(initialSala);
    renderSalaTable(initialSala);
  } else {
    renderSalaTable(salaDoc.data());
  }

  // Load Cucina data
  const cucinaDoc = await db.collection('temperature').doc('cucina').get();
  if (!cucinaDoc.exists) {
    const initialCucina = {};
    for (let g = 1; g <= 31; g++) {
      initialCucina[g] = {
        giorno: g,
        ora: '',
        operatore: '',
        cucina: '',
        cucina2: '',
        pizzeria: '',
        tavoloR1: '',
        tavoloR2: '',
        cellaPiu: '',
        cellaMeno: ''
      };
    }
    await db.collection('temperature').doc('cucina').set(initialCucina);
    renderCucinaTable(initialCucina);
  } else {
    renderCucinaTable(cucinaDoc.data());
  }
}

// Render Sala table rows
function renderSalaTable(data) {
  salaTableBody.innerHTML = '';
  for (let i = 1; i <= 31; i++) {
    const row = data[i];
    if (!row) continue;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.giorno}</td>
      <td contenteditable="true" data-field="ora" data-giorno="${row.giorno}">${row.ora}</td>
      <td contenteditable="true" data-field="operatore" data-giorno="${row.giorno}">${row.operatore}</td>
      <td contenteditable="true" data-field="banco" data-giorno="${row.giorno}">${row.banco}</td>
      <td contenteditable="true" data-field="bindi" data-giorno="${row.giorno}">${row.bindi}</td>
      <td contenteditable="true" data-field="vetrinetta" data-giorno="${row.giorno}">${row.vetrinetta}</td>
      <td contenteditable="true" data-field="levissima" data-giorno="${row.giorno}">${row.levissima}</td>
      <td contenteditable="true" data-field="cantinaVini" data-giorno="${row.giorno}">${row.cantinaVini}</td>
    `;
    salaTableBody.appendChild(tr);
  }

  addSalaListeners();
}

// Render Cucina table rows
function renderCucinaTable(data) {
  cucinaTableBody.innerHTML = '';
  for (let i = 1; i <= 31; i++) {
    const row = data[i];
    if (!row) continue;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.giorno}</td>
      <td contenteditable="true" data-field="ora" data-giorno="${row.giorno}">${row.ora}</td>
      <td contenteditable="true" data-field="operatore" data-giorno="${row.giorno}">${row.operatore}</td>
      <td contenteditable="true" data-field="cucina" data-giorno="${row.giorno}">${row.cucina}</td>
      <td contenteditable="true" data-field="cucina2" data-giorno="${row.giorno}">${row.cucina2}</td>
      <td contenteditable="true" data-field="pizzeria" data-giorno="${row.giorno}">${row.pizzeria}</td>
      <td contenteditable="true" data-field="tavoloR1" data-giorno="${row.giorno}">${row.tavoloR1}</td>
      <td contenteditable="true" data-field="tavoloR2" data-giorno="${row.giorno}">${row.tavoloR2}</td>
      <td contenteditable="true" data-field="cellaPiu" data-giorno="${row.giorno}">${row.cellaPiu}</td>
      <td contenteditable="true" data-field="cellaMeno" data-giorno="${row.giorno}">${row.cellaMeno}</td>
    `;
    cucinaTableBody.appendChild(tr);
  }

  addCucinaListeners();
}

// Add listeners for Sala table cells to update Firebase on blur
function addSalaListeners() {
  salaTableBody.querySelectorAll('[contenteditable]').forEach(cell => {
    cell.onblur = async () => {
      const giorno = cell.dataset.giorno;
      const field = cell.dataset.field;
      const value = cell.textContent.trim();
      const salaDocRef = db.collection('temperature').doc('sala');

      const salaDoc = await salaDocRef.get();
      if (!salaDoc.exists) return;

      const data = salaDoc.data();
      data[giorno][field] = value;

      await salaDocRef.set(data);
    };
  });
}

// Add listeners for Cucina table cells to update Firebase on blur
function addCucinaListeners() {
  cucinaTableBody.querySelectorAll('[contenteditable]').forEach(cell => {
    cell.onblur = async () => {
      const giorno = cell.dataset.giorno;
      const field = cell.dataset.field;
      const value = cell.textContent.trim();
      const cucinaDocRef = db.collection('temperature').doc('cucina');

      const cucinaDoc = await cucinaDocRef.get();
      if (!cucinaDoc.exists) return;

      const data = cucinaDoc.data();
      data[giorno][field] = value;

      await cucinaDocRef.set(data);
    };
  });
}

// PDF export for Sala table
exportSalaBtn.addEventListener('click', () => {
  import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js').then(({ jsPDF }) => {
    const doc = new jsPDF.jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text("REGISTRO CONTROLLO DELLE TEMPERATURE - SALA", 10, 15);
    doc.text(`MESE / ANNO: ${meseSalaSpan.textContent} / ${annoSalaSpan.textContent}`, 10, 25);

    // Table columns and rows
    const columns = ["Giorno", "Ora", "Operatore", "Banco", "Bindi", "Vetrinetta", "Levissima", "Cantina Vini"];
    const rows = [];
    for (let i = 1; i <= 31; i++) {
      const row = salaTableBody.children[i-1];
      if (!row) continue;
      const cells = Array.from(row.children).map(td => td.textContent || '');
      rows.push(cells);
    }

    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 30,
      styles: { fontSize: 9 },
    });
    doc.save("registro_sala.pdf");
  });
});

// PDF export for Cucina table
exportCucinaBtn.addEventListener('click', () => {
  import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js').then(({ jsPDF }) => {
    const doc = new jsPDF.jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text("REGISTRO CONTROLLO DELLE TEMPERATURE - CUCINA", 10, 15);
    doc.text(`MESE / ANNO: ${meseCucinaSpan.textContent} / ${annoCucinaSpan.textContent}`, 10, 25);

    const columns = ["Giorno", "Ora", "Operatore", "Cucina", "Cucina 2", "Pizzeria", "Tavolo R1", "Tavolo R2", "Cella +", "Cella -"];
    const rows = [];
    for (let i = 1; i <= 31; i++) {
      const row = cucinaTableBody.children[i-1];
      if (!row) continue;
      const cells = Array.from(row.children).map(td => td.textContent || '');
      rows.push(cells);
    }

    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 30,
      styles: { fontSize: 9 },
    });
    doc.save("registro_cucina.pdf");
  });
});

// Initial load
updateTemperatureArea();

</script>

</body>
</html>
