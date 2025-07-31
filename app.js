// Firestore reference
const tempCollection = db.collection('temperature_records');

// Elements
const meseSelect = document.getElementById('meseSelect');
const annoInput = document.getElementById('annoInput');
const showSalaBtn = document.getElementById('showSalaBtn');
const showCucinaBtn = document.getElementById('showCucinaBtn');
const exportPdfBtn = document.getElementById('exportTempPdfBtn');

const salaTable = document.getElementById('salaTable');
const cucinaTable = document.getElementById('cucinaTable');

let currentTipo = 'sala'; // 'sala' or 'cucina'
let currentMese = parseInt(meseSelect.value);
let currentAnno = parseInt(annoInput.value);

let unsubscribe = null; // Firestore listener unsubscribe fn
let operatorSet = new Set(); // to hold unique operator names

// Columns per tipo
const columnsByTipo = {
  sala: ['banco', 'bindi', 'vetrinetta', 'levissima', 'cantina_vini'],
  cucina: ['cucina', 'cucina_2', 'pizzeria', 'tavolo_r1', 'tavolo_r2', 'cella_piu', 'cella_meno'],
};

// Utility to get current time HH:mm
function getCurrentTimeStr() {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

// Create an editable cell with optional initial value and special input types
function createEditableCell(value = '', isOperator = false, operators = []) {
  if (isOperator) {
    // Create a datalist dropdown + input for operator
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.setAttribute('list', 'operatorList');
    input.style.width = '120px';

    // Create datalist only once
    if (!document.getElementById('operatorList')) {
      const datalist = document.createElement('datalist');
      datalist.id = 'operatorList';
      document.body.appendChild(datalist);
    }
    const datalist = document.getElementById('operatorList');
    datalist.innerHTML = ''; // reset options
    operators.forEach(op => {
      const option = document.createElement('option');
      option.value = op;
      datalist.appendChild(option);
    });
    return input;
  } else {
    // For Ora (time), we can create a time input for better UX
    // or contenteditable div if you want free text
    // Let's use <input type="time"> for Ora for convenience
    const input = document.createElement('input');
    if (value.match(/^\d{2}:\d{2}$/)) {
      input.type = 'time';
      input.value = value;
    } else {
      // Otherwise, simple text input (editable)
      input.type = 'text';
      input.value = value;
    }
    input.style.width = '70px';
    return input;
  }
}

// Render table rows for given tipo and dataMap (key: giorno, value: data object)
function renderTable(tipo, dataMap) {
  const table = tipo === 'sala' ? salaTable : cucinaTable;
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';

  // Prepare operator list from existing data
  operatorSet.clear();
  for (const dayData of Object.values(dataMap)) {
    if (dayData.operatore) operatorSet.add(dayData.operatore);
  }
  const operatorList = Array.from(operatorSet);

  // Columns for this tipo
  const tempColumns = columnsByTipo[tipo];

  for (let giorno = 1; giorno <= 31; giorno++) {
    const data = dataMap[giorno] || {
      giorno,
      ora: getCurrentTimeStr(),
      operatore: '',
      temperature: {},
    };

    const tr = document.createElement('tr');

    // Giorno (not editable)
    const tdGiorno = document.createElement('td');
    tdGiorno.textContent = giorno;
    tr.appendChild(tdGiorno);

    // Ora (time input)
    const oraInput = createEditableCell(data.ora || getCurrentTimeStr());
    tr.appendChild(oraInput.parentElement ? oraInput.parentElement : (() => { const td = document.createElement('td'); td.appendChild(oraInput); return td; })());
    tr.appendChild(document.createElement('td')); // We'll fix below to ensure proper append

    // Actually put oraInput inside a td
    const tdOra = document.createElement('td');
    tdOra.appendChild(oraInput);
    tr.appendChild(tdOra);

    // Operatore (input with datalist)
    const operatorInput = createEditableCell(data.operatore || '', true, operatorList);
    const tdOperatore = document.createElement('td');
    tdOperatore.appendChild(operatorInput);
    tr.appendChild(tdOperatore);

    // Temperature columns
    for (const col of tempColumns) {
      const td = document.createElement('td');
      const val = data.temperature ? (data.temperature[col] || '') : '';
      const tempInput = document.createElement('input');
      tempInput.type = 'text';
      tempInput.value = val;
      tempInput.style.width = '60px';
      td.appendChild(tempInput);
      tr.appendChild(td);
    }

    tbody.appendChild(tr);

    // Save handler (debounced)
    function debounce(func, delay) {
      let timer;
      return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
      };
    }

    const saveRow = debounce(() => {
      // Collect row data
      const ora = oraInput.value.trim();
      const operatore = operatorInput.value.trim();
      const temperature = {};
      for (let i = 0; i < tempColumns.length; i++) {
        const inputElem = tr.children[4 + i].querySelector('input');
        temperature[tempColumns[i]] = inputElem.value.trim();
      }

      // Save to Firestore
      saveTemperatureRecord({
        mese: currentMese,
        anno: currentAnno,
        tipo,
        giorno,
        ora,
        operatore,
        temperature,
      });
    }, 1000);

    // Attach listeners to inputs to save on change
    oraInput.addEventListener('input', saveRow);
    operatorInput.addEventListener('input', saveRow);
    for (let i = 0; i < tempColumns.length; i++) {
      const inputElem = tr.children[4 + i].querySelector('input');
      inputElem.addEventListener('input', saveRow);
    }
  }
}

// Save a temperature record (row) to Firestore
async function saveTemperatureRecord(record) {
  try {
    // Compose doc ID as tipo-mese-anno-giorno for uniqueness
    const docId = `${record.tipo}-${record.mese}-${record.anno}-${record.giorno}`;

    // Save/overwrite
    await tempCollection.doc(docId).set(record);
    // Update operator set for dropdowns
    operatorSet.add(record.operatore);
  } catch (error) {
    console.error('Error saving temperature record:', error);
  }
}

// Load data from Firestore for current selection and tipo
function loadData(tipo) {
  if (unsubscribe) unsubscribe();

  unsubscribe = tempCollection
    .where('mese', '==', currentMese)
    .where('anno', '==', currentAnno)
    .where('tipo', '==', tipo)
    .onSnapshot(snapshot => {
      const dataMap = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        dataMap[data.giorno] = data;
      });
      renderTable(tipo, dataMap);
    });
}

// Show Sala table, hide Cucina
function showSala() {
  currentTipo = 'sala';
  salaTable.style.display = 'table';
  cucinaTable.style.display = 'none';
  loadData('sala');
}

// Show Cucina table, hide Sala
function showCucina() {
  currentTipo = 'cucina';
  salaTable.style.display = 'none';
  cucinaTable.style.display = 'table';
  loadData('cucina');
}

// Export visible table to PDF using jsPDF and autoTable plugin
function exportTableToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape');

  const meseNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

  // Title
  doc.setFontSize(16);
  doc.text('REGISTRO CONTROLLO DELLE TEMPERATURE', 14, 15);

  // Mese/Anno info
  doc.setFontSize(12);
  doc.text(`Mese: ${meseNames[currentMese - 1]}    Anno: ${currentAnno}`, 14, 23);

  // Prepare headers and body
  let headers, body = [];
  if (currentTipo === 'sala') {
    headers = ['Giorno', 'Ora', 'Operatore', 'Banco', 'Bindi', 'Vetrinetta', 'Levissima', 'Cantina Vini'];
    const rows = salaTable.querySelectorAll('tbody tr');
    rows.forEach(tr => {
      const rowData = [];
      tr.querySelectorAll('td, th').forEach(td => rowData.push(td.textContent || td.querySelector('input')?.value || ''));
      // inputs might not have textContent, get value
      const giorno = tr.children[0].textContent;
      const ora = tr.children[1].querySelector('input').value || '';
      const operatore = tr.children[2].querySelector('input').value || '';
      const banco = tr.children[3].querySelector('input').value || '';
      const bindi = tr.children[4].querySelector('input').value || '';
      const vetrinetta = tr.children[5].querySelector('input').value || '';
      const levissima = tr.children[6].querySelector('input').value || '';
      const cantina = tr.children[7].querySelector('input').value || '';
      body.push([giorno, ora, operatore, banco, bindi, vetrinetta, levissima, cantina]);
    });
  } else {
    headers = ['Giorno', 'Ora', 'Operatore', 'Cucina', 'Cucina 2', 'Pizzeria', 'Tavolo R1', 'Tavolo R2', 'Cella +', 'Cella -'];
    const rows = cucinaTable.querySelectorAll('tbody tr');
    rows.forEach(tr => {
      const giorno = tr.children[0].textContent;
      const ora = tr.children[1].querySelector('input').value || '';
      const operatore = tr.children[2].querySelector('input').value || '';
      const cucina = tr.children[3].querySelector('input').value || '';
      const cucina2 = tr.children[4].querySelector('input').value || '';
      const pizzeria = tr.children[5].querySelector('input').value || '';
      const tavoloR1 = tr.children[6].querySelector('input').value || '';
      const tavoloR2 = tr.children[7].querySelector('input').value || '';
      const cellaPiu = tr.children[8].querySelector('input').value || '';
      const cellaMeno = tr.children[9].querySelector('input').value || '';
      body.push([giorno, ora, operatore, cucina, cucina2, pizzeria, tavoloR1, tavoloR2, cellaPiu, cellaMeno]);
    });
  }

  // Use autoTable plugin
  doc.autoTable({
    head: [headers],
    body,
    startY: 30,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 123, 255] },
  });

  doc.save(`Registro_Temperature_${currentTipo}_${meseNames[currentMese - 1]}_${currentAnno}.pdf`);
}

// Event listeners

showSalaBtn.addEventListener('click', () => {
  showSala();
});

showCucinaBtn.addEventListener('click', () => {
  showCucina();
});

meseSelect.addEventListener('change', () => {
  currentMese = parseInt(meseSelect.value);
  loadData(currentTipo);
});

annoInput.addEventListener('change', () => {
  currentAnno = parseInt(annoInput.value);
  loadData(currentTipo);
});

exportPdfBtn.addEventListener('click', () => {
  exportTableToPDF();
});

// Init on load
window.addEventListener('load', () => {
  showSala();
});
