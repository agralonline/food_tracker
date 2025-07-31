// =============== FIREBASE SETUP (add your config here) ===============
// Replace with your Firebase config, initialize Firebase app and Firestore

// Example:
// const firebaseConfig = { ... };
// firebase.initializeApp(firebaseConfig);
// const db = firebase.firestore();

let db; // Placeholder for Firestore instance

// ====== GLOBAL VARIABLES =======
const alimentiForm = document.getElementById('alimentiForm');
const alimentiTableBody = document.getElementById('alimentiTableBody');

const btnAlimenti = document.getElementById('btnAlimenti');
const btnTemperature = document.getElementById('btnTemperature');
const logoutBtn = document.getElementById('logoutBtn');

const alimentiSection = document.getElementById('alimentiSection');
const temperatureSection = document.getElementById('temperatureSection');

const areaSelect = document.getElementById('areaSelect');
const salaTable = document.getElementById('salaTable');
const cucinaTable = document.getElementById('cucinaTable');

const meseSala = document.getElementById('meseSala');
const annoSala = document.getElementById('annoSala');
const meseCucina = document.getElementById('meseCucina');
const annoCucina = document.getElementById('annoCucina');

const salaTableBody = document.getElementById('salaTableBody');
const cucinaTableBody = document.getElementById('cucinaTableBody');

// Stato modifica alimento (null = add new)
let editingAlimentoId = null;

// --------- UTILITIES -----------

function formatDateIt(date) {
  // date = Date object or date string ISO
  let d = new Date(date);
  let day = d.getDate().toString().padStart(2, '0');
  let month = (d.getMonth() + 1).toString().padStart(2, '0');
  let year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function parseDateFromInput(dateInputValue) {
  // dateInputValue format: yyyy-mm-dd
  if (!dateInputValue) return null;
  const parts = dateInputValue.split('-');
  if (parts.length !== 3) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function getTodayISODate() {
  let d = new Date();
  return d.toISOString().split('T')[0];
}

// --------- RENDER ALIMENTI -----------

async function renderAlimenti() {
  alimentiTableBody.innerHTML = '';

  // Fetch alimenti from Firestore here, ordered by dataScadenza ascending
  // Sample dummy data (replace with Firestore fetching)
  // let alimenti = await fetchAlimentiFromFirestore();

  // Dummy placeholder array for example:
  // alimenti = [
  //   {id:'1', nome:'Pane', dataPreparazione:'2025-07-30', dataScadenza:'2025-08-02', processo:'Abbattuto -18° C', quantita:'10', sottovuoto:'Si'},
  // ];

  // TODO: replace with actual Firestore fetch code
  let alimenti = await fetchAlimentiFromFirestore();

  alimenti.forEach(alimento => {
    const tr = document.createElement('tr');

    // Highlight expired or soon expiring items (optional)
    let now = new Date();
    let scadenza = parseDateFromInput(alimento.dataScadenza);
    let diffTime = scadenza - now;
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      tr.style.backgroundColor = '#f8d7da'; // red for expired
    } else if (diffDays <= 1) {
      tr.style.backgroundColor = '#fff3cd'; // yellow for expiring soon
    }

    tr.innerHTML = `
      <td>${alimento.nome}</td>
      <td>${formatDateIt(alimento.dataPreparazione)}</td>
      <td>${formatDateIt(alimento.dataScadenza)}</td>
      <td>${alimento.processo}</td>
      <td>${alimento.quantita}</td>
      <td>${alimento.sottovuoto}</td>
      <td>
        <button class="edit-btn" data-id="${alimento.id}">Modifica</button>
        <button class="delete-btn" data-id="${alimento.id}">Elimina</button>
      </td>
    `;

    alimentiTableBody.appendChild(tr);
  });

  // Attach listeners for edit/delete buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = e => {
      const id = e.target.getAttribute('data-id');
      editAlimento(id);
    };
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = e => {
      const id = e.target.getAttribute('data-id');
      deleteAlimento(id);
    };
  });
}

// --------- FETCH ALIMENTI FROM FIRESTORE (dummy example) -----------

async function fetchAlimentiFromFirestore() {
  // TODO: Replace with Firestore fetching code
  // Example: get collection "alimenti", orderBy dataScadenza ascending
  // Return array of {id, nome, dataPreparazione, dataScadenza, processo, quantita, sottovuoto}
  // For now return empty array to avoid errors:
  return [];
}

// --------- ADD OR UPDATE ALIMENTO -----------

alimentiForm.addEventListener('submit', async e => {
  e.preventDefault();

  const nome = alimentiForm.nomeAlimento.value.trim();
  const dataPreparazione = alimentiForm.dataPreparazione.value;
  const dataScadenza = alimentiForm.dataScadenza.value;
  const processo = alimentiForm.processoAlimento.value;
  const quantita = alimentiForm.quantitaAlimento.value.trim();
  const sottovuoto = alimentiForm.sottovuoto.value;

  if (!nome || !dataPreparazione || !dataScadenza || !processo || !quantita || !sottovuoto) {
    alert('Compila tutti i campi!');
    return;
  }

  // Prepare alimento object
  const alimentoData = {
    nome,
    dataPreparazione,
    dataScadenza,
    processo,
    quantita,
    sottovuoto,
  };

  if (editingAlimentoId) {
    // Update existing alimento in Firestore
    await updateAlimentoInFirestore(editingAlimentoId, alimentoData);
    editingAlimentoId = null;
    alimentiForm.querySelector('button[type="submit"]').textContent = 'Aggiungi Alimento';
  } else {
    // Add new alimento to Firestore
    await addAlimentoToFirestore(alimentoData);
  }

  alimentiForm.reset();
  await renderAlimenti();
});

// --------- FIRESTORE ADD/UPDATE/DELETE FUNCTIONS (to be implemented) -----------

async function addAlimentoToFirestore(data) {
  // TODO: implement Firestore add
  console.log('Aggiungi alimento', data);
}

async function updateAlimentoInFirestore(id, data) {
  // TODO: implement Firestore update
  console.log('Aggiorna alimento', id, data);
}

async function deleteAlimentoFromFirestore(id) {
  // TODO: implement Firestore delete
  console.log('Elimina alimento', id);
}

// --------- EDIT AND DELETE HANDLERS -----------

async function editAlimento(id) {
  // Fetch alimento by id from Firestore and fill form
  // TODO: Replace with Firestore fetching by id
  const alimento = await getAlimentoById(id);
  if (!alimento) return alert('Alimento non trovato');

  alimentiForm.nomeAlimento.value = alimento.nome;
  alimentiForm.dataPreparazione.value = alimento.dataPreparazione;
  alimentiForm.dataScadenza.value = alimento.dataScadenza;
  alimentiForm.processoAlimento.value = alimento.processo;
  alimentiForm.quantitaAlimento.value = alimento.quantita;

  // Set sottovuoto radio buttons
  const radios = alimentiForm.querySelectorAll('input[name="sottovuoto"]');
  radios.forEach(r => (r.checked = r.value === alimento.sottovuoto));

  editingAlimentoId = id;
  alimentiForm.querySelector('button[type="submit"]').textContent = 'Salva Modifica';
}

async function deleteAlimento(id) {
  if (!confirm('Sei sicuro di voler eliminare questo alimento?')) return;
  await deleteAlimentoFromFirestore(id);
  await renderAlimenti();
}

// Dummy getAlimentoById (replace with Firestore)
async function getAlimentoById(id) {
  // TODO: implement Firestore fetch by id
  return null;
}

// --------- SECTION SWITCHING -----------

btnAlimenti.onclick = () => {
  alimentiSection.classList.remove('hidden');
  temperatureSection.classList.add('hidden');
  areaSelect.value = '';
  salaTable.classList.add('hidden');
  cucinaTable.classList.add('hidden');
};

btnTemperature.onclick = () => {
  alimentiSection.classList.add('hidden');
  temperatureSection.classList.remove('hidden');
  areaSelect.value = '';
  salaTable.classList.add('hidden');
  cucinaTable.classList.add('hidden');
};

// --------- TEMPERATURE TABLES GENERATION -----------

function fillMonthYear() {
  let now = new Date();
  let monthNames = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  let monthStr = monthNames[now.getMonth()];
  let yearStr = now.getFullYear();

  meseSala.textContent = monthStr;
  annoSala.textContent = yearStr;
  meseCucina.textContent = monthStr;
  annoCucina.textContent = yearStr;
}

function createTemperatureRow(giorno, fields, tableType) {
  // giorno = number
  // fields = array of field names to create inputs for (e.g. ["Banco","Bindi",...])
  // tableType = "sala" or "cucina"

  let tr = document.createElement('tr');

  // Giorno cell
  let tdGiorno = document.createElement('td');
  tdGiorno.textContent = giorno;
  tr.appendChild(tdGiorno);

  // Ora cell - input type text
  let tdOra = document.createElement('td');
  let oraInput = document.createElement('input');
  oraInput.type = 'text';
  oraInput.placeholder = 'hh:mm';
  oraInput.classList.add('ora-input');
  oraInput.dataset.giorno = giorno;
  oraInput.dataset.field = 'ora';
  oraInput.dataset.area = tableType;
  tdOra.appendChild(oraInput);
  tr.appendChild(tdOra);

  // Operatore cell - input text
  let tdOperatore = document.createElement('td');
  let operatoreInput = document.createElement('input');
  operatoreInput.type = 'text';
  operatoreInput.placeholder = 'Nome';
  operatoreInput.classList.add('operatore-input');
  operatoreInput.dataset.giorno = giorno;
  operatoreInput.dataset.field = 'operatore';
  operatoreInput.dataset.area = tableType;
  tdOperatore.appendChild(operatoreInput);
  tr.appendChild(tdOperatore);

  // Other temperature fields
  fields.forEach(field => {
    let tdTemp = document.createElement('td');

    // Wrapper for input + °C label
    let wrapper = document.createElement('div');
    wrapper.classList.add('temp-input-wrapper');

    let inputTemp = document.createElement('input');
    inputTemp.type = 'number';
    inputTemp.min = -50;
    inputTemp.max = 50;
    inputTemp.step = 0.1;
    inputTemp.placeholder = '';
    inputTemp.dataset.giorno = giorno;
    inputTemp.dataset.field = field.toLowerCase().replace(/\s+/g, '');
    inputTemp.dataset.area = tableType;

    // °C label
    let degLabel = document.createElement('span');
    degLabel.classList.add('deg-label');
    degLabel.textContent = '°C';

    wrapper.appendChild(inputTemp);
    wrapper.appendChild(degLabel);
    tdTemp.appendChild(wrapper);
    tr.appendChild(tdTemp);
  });

  return tr;
}

function generateTemperatureTables() {
  // Clear existing rows
  salaTableBody.innerHTML = '';
  cucinaTableBody.innerHTML = '';

  // Sala fields:
  const salaFields = ['Banco','Bindi','Vetrinetta','Levissima','CantinaVini'];
  // Cucina fields:
  const cucinaFields = ['Cucina','Cucina2','Pizzeria','TavoloR1','TavoloR2','CellaPlus','CellaMinus'];

  for(let day=1; day<=31; day++) {
    salaTableBody.appendChild(createTemperatureRow(day, salaFields, 'sala'));
    cucinaTableBody.appendChild(createTemperatureRow(day, cucinaFields, 'cucina'));
  }
}

// --------- AREA SELECT HANDLER -----------

areaSelect.onchange = () => {
  if (areaSelect.value === 'sala') {
    salaTable.classList.remove('hidden');
    cucinaTable.classList.add('hidden');
  } else if (areaSelect.value === 'cucina') {
    cucinaTable.classList.remove('hidden');
    salaTable.classList.add('hidden');
  } else {
    salaTable.classList.add('hidden');
    cucinaTable.classList.add('hidden');
  }
};

// --------- SAVE AND LOAD TEMPERATURES -----------

async function saveTemperatures() {
  // Save all inputs to Firestore
  // We save separately per area and per giorno (day)
  // Document id format: `${area}-${giorno}-${month}-${year}`
  let now = new Date();
  let month = now.getMonth() + 1;
  let year = now.getFullYear();

  const areas = ['sala','cucina'];
  for (let area of areas) {
    let fields = (area === 'sala') ? ['banco','bindi','vetrinetta','levissima','cantinavini'] : ['cucina','cucina2','pizzeria','tavolor1','tavolor2','cellaplus','cellaminus'];

    for (let day=1; day<=31; day++) {
      let docId = `${area}-${day}-${month}-${year}`;
      let dataToSave = {};

      // Get inputs for day and area
      // Inputs: ora, operatore + fields
      let oraInput = document.querySelector(`input[data-area="${area}"][data-giorno="${day}"][data-field="ora"]`);
      let operatoreInput = document.querySelector(`input[data-area="${area}"][data-giorno="${day}"][data-field="operatore"]`);

      if (oraInput) dataToSave.ora = oraInput.value;
      if (operatoreInput) dataToSave.operatore = operatoreInput.value;

      fields.forEach(f => {
        let inputEl = document.querySelector(`input[data-area="${area}"][data-giorno="${day}"][data-field="${f}"]`);
        if (inputEl) {
          dataToSave[f] = inputEl.value;
        }
      });

      // Save to Firestore
      await saveTemperatureToFirestore(docId, dataToSave);
    }
  }

  alert('Temperature salvate con successo!');
}

async function loadTemperatures() {
  // Load all temperature data from Firestore and fill inputs
  let now = new Date();
  let month = now.getMonth() + 1;
  let year = now.getFullYear();

  const areas = ['sala','cucina'];
  for (let area of areas) {
    let fields = (area === 'sala') ? ['banco','bindi','vetrinetta','levissima','cantinavini'] : ['cucina','cucina2','pizzeria','tavolor1','tavolor2','cellaplus','cellaminus'];

    for (let day=1; day<=31; day++) {
      let docId = `${area}-${day}-${month}-${year}`;
      let data = await getTemperatureFromFirestore(docId);
      if (!data) continue;

      // Fill inputs
      let oraInput = document.querySelector(`input[data-area="${area}"][data-giorno="${day}"][data-field="ora"]`);
      let operatoreInput = document.querySelector(`input[data-area="${area}"][data-giorno="${day}"][data-field="operatore"]`);

      if (oraInput && data.ora) oraInput.value = data.ora;
      if (operatoreInput && data.operatore) operatoreInput.value = data.operatore;

      fields.forEach(f => {
        let inputEl = document.querySelector(`input[data-area="${area}"][data-giorno="${day}"][data-field="${f}"]`);
        if (inputEl && data[f]) inputEl.value = data[f];
      });
    }
  }
}

// --------- FIRESTORE SAVE/LOAD FOR TEMPERATURES -----------

async function saveTemperatureToFirestore(docId, data) {
  // TODO: Implement Firestore save for temperature document with docId
  console.log('Save temperature', docId, data);
}

async function getTemperatureFromFirestore(docId) {
  // TODO: Implement Firestore fetch for temperature document with docId
  console.log('Get temperature', docId);
  return null;
}

// --------- INITIALIZATION -----------

function init() {
  fillMonthYear();
  generateTemperatureTables();
  renderAlimenti();

  // Default section
  btnAlimenti.click();

  // Load temperatures
  loadTemperatures();
}

init();
