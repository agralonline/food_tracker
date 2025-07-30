document.addEventListener('DOMContentLoaded', function () {
  // Set today's date in input type=date format (YYYY-MM-DD)
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const formattedDate = `${yyyy}-${mm}-${dd}`;
  document.getElementById('data').value = formattedDate;

  // Load saved items from localStorage and show them
  loadDataFromLocalStorage();

  // Show data container only if data exists
  toggleDataContainer();

  // Button toggles for Alimenti and Temperature
  const btnAlimenti = document.getElementById('btnAlimenti');
  const btnTemperature = document.getElementById('btnTemperature');
  const sliderContainer = document.getElementById('sliderContainer');
  const roomSlider = document.getElementById('roomSlider');
  const roomLabel = document.getElementById('roomLabel');

  btnAlimenti.addEventListener('click', () => {
    btnAlimenti.classList.add('active');
    btnTemperature.classList.remove('active');
    sliderContainer.style.display = 'none';
    document.getElementById('formContainer').style.display = 'block';
    document.getElementById('dataContainer').style.display = 'block';
  });

  btnTemperature.addEventListener('click', () => {
    btnTemperature.classList.add('active');
    btnAlimenti.classList.remove('active');
    sliderContainer.style.display = 'flex';
    document.getElementById('formContainer').style.display = 'none';
    document.getElementById('dataContainer').style.display = 'none';
  });

  roomSlider.addEventListener('input', () => {
    roomLabel.textContent = roomSlider.value === '0' ? 'Sala' : 'Cucina';
  });

  // Handle form submit: add new item
  document.getElementById('foodForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const data = document.getElementById('data').value;
    const prodotto = document.getElementById('prodotto').value.trim();
    const quantitaRaw = document.getElementById('quantita').value;
    const quantita = quantitaRaw ? quantitaRaw : 'N/A';
    const scelta = document.getElementById('scelta').value;
    const scadenza = document.getElementById('scadenza').value;

    if (!data || !prodotto || !scelta || !scadenza) {
      alert('Per favore compila tutti i campi obbligatori.');
      return;
    }

    // Add to table
    addRowToTable(data, prodotto, quantita, scelta, scadenza);

    // Save updated data to localStorage
    saveDataToLocalStorage();

    // Reset form (keep today's date)
    this.reset();
    document.getElementById('data').value = formattedDate;

    // Show data container
    toggleDataContainer();
  });

  // Export to PDF button
  document.getElementById('exportPdfBtn').addEventListener('click', () => {
    const element = document.getElementById('foodTable');
    html2pdf().from(element).set({
      margin: 1,
      filename: 'Elenco_Alimenti.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).save();
  });
});

// Add a new row to the table
function addRowToTable(data, prodotto, quantita, scelta, scadenza) {
  const tableBody = document.getElementById('foodTable').querySelector('tbody');

  const newRow = document.createElement('tr');
  newRow.innerHTML = `
    <td>${formatDateDisplay(data)}</td>
    <td>${escapeHtml(prodotto)}</td>
    <td>${quantita}</td>
    <td>${scelta}</td>
    <td>${formatDateDisplay(scadenza)}</td>
  `;

  tableBody.appendChild(newRow);
}

// Save table data to localStorage
function saveDataToLocalStorage() {
  const tableBody = document.getElementById('foodTable').querySelector('tbody');
  const rows = tableBody.querySelectorAll('tr');
  const dataToSave = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    dataToSave.push({
      data: formatDateForStorage(cells[0].textContent),
      prodotto: cells[1].textContent,
      quantita: cells[2].textContent,
      scelta: cells[3].textContent,
      scadenza: formatDateForStorage(cells[4].textContent)
    });
  });

  localStorage.setItem('foodItems', JSON.stringify(dataToSave));
}

// Load data from localStorage into table
function loadDataFromLocalStorage() {
  const savedData = localStorage.getItem('foodItems');
  if (!savedData) return;

  const items = JSON.parse(savedData);
  items.forEach(item => {
    addRowToTable(item.data, item.prodotto, item.quantita, item.scelta, item.scadenza);
  });
}

// Show or hide data container depending on data presence
function toggleDataContainer() {
  const tableBody = document.getElementById('foodTable').querySelector('tbody');
  const container = document.getElementById('dataContainer');
  container.style.display = tableBody.children.length ? 'block' : 'none';
}

// Format date YYYY-MM-DD to DD/MM/YYYY for display
function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Format date DD/MM/YYYY back to YYYY-MM-DD for storage
function formatDateForStorage(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// Escape HTML to prevent injection
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
