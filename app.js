document.addEventListener('DOMContentLoaded', function () {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const formattedDate = `${yyyy}-${mm}-${dd}`; // for input type="date"

  const dataInput = document.getElementById('data');
  dataInput.value = formattedDate;

  const btnAlimenti = document.getElementById('btnAlimenti');
  const btnTemperature = document.getElementById('btnTemperature');
  const formContainer = document.getElementById('formContainer');
  const dataContainer = document.getElementById('dataContainer');
  const sliderContainer = document.getElementById('sliderContainer');
  const roomSlider = document.getElementById('roomSlider');
  const roomLabel = document.getElementById('roomLabel');
  const foodForm = document.getElementById('foodForm');
  const exportPdfBtn = document.getElementById('exportPdfBtn');
  const foodTableBody = document.querySelector('#foodTable tbody');

  // Load saved items from localStorage and display them
  loadDataFromLocalStorage();

  // Initially show Alimenti section
  showAlimenti();

  // Button click handlers
  btnAlimenti.addEventListener('click', () => {
    showAlimenti();
  });

  btnTemperature.addEventListener('click', () => {
    showTemperature();
  });

  // Slider change to update label
  roomSlider.addEventListener('input', () => {
    roomLabel.textContent = roomSlider.value === '0' ? 'Sala' : 'Cucina';
  });

  // Form submit handler
  foodForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = dataInput.value;
    const prodotto = document.getElementById('prodotto').value.trim();
    const quantita = document.getElementById('quantita').value || 'N/A';
    const scelta = document.getElementById('scelta').value;
    const scadenza = document.getElementById('scadenza').value;

    if (!data || !prodotto || !scadenza || !scelta) {
      alert('Compila tutti i campi richiesti!');
      return;
    }

    addRowToTable(data, prodotto, quantita, scelta, scadenza);

    saveDataToLocalStorage();

    foodForm.reset();
    dataInput.value = formattedDate;
  });

  // Export to PDF button
  exportPdfBtn.addEventListener('click', () => {
    const element = document.getElementById('foodTable');
    const opt = {
      margin: 0.5,
      filename: 'elenco_alimenti.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' },
    };
    html2pdf().set(opt).from(element).save();
  });

  // Functions

  function showAlimenti() {
    btnAlimenti.classList.add('active');
    btnTemperature.classList.remove('active');

    formContainer.style.display = 'block';
    dataContainer.style.display = foodTableBody.children.length > 0 ? 'block' : 'none';
    sliderContainer.style.display = 'none';
  }

  function showTemperature() {
    btnTemperature.classList.add('active');
    btnAlimenti.classList.remove('active');

    formContainer.style.display = 'none';
    dataContainer.style.display = 'none';
    sliderContainer.style.display = 'flex'; // flex for align-items center

    // Reset slider label to default
    roomSlider.value = '0';
    roomLabel.textContent = 'Sala';
  }

  function addRowToTable(data, prodotto, quantita, scelta, scadenza) {
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td>${formatDateDisplay(data)}</td>
      <td>${escapeHtml(prodotto)}</td>
      <td>${quantita}</td>
      <td>${scelta}</td>
      <td>${formatDateDisplay(scadenza)}</td>
    `;
    foodTableBody.appendChild(newRow);
    dataContainer.style.display = 'block';
  }

  function saveDataToLocalStorage() {
    const rows = foodTableBody.querySelectorAll('tr');
    const items = [];

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      items.push({
        data: formatDateISO(cells[0].textContent),
        prodotto: cells[1].textContent,
        quantita: cells[2].textContent,
        scelta: cells[3].textContent,
        scadenza: formatDateISO(cells[4].textContent),
      });
    });

    localStorage.setItem('foodItems', JSON.stringify(items));
  }

  function loadDataFromLocalStorage() {
    const savedData = JSON.parse(localStorage.getItem('foodItems')) || [];
    savedData.forEach(item => {
      addRowToTable(item.data, item.prodotto, item.quantita, item.scelta, item.scadenza);
    });
  }

  // Helper to format date yyyy-mm-dd to dd/mm/yyyy for display
  function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('it-IT');
  }

  // Helper to convert dd/mm/yyyy or dd-mm-yyyy to ISO yyyy-mm-dd (input date format)
  function formatDateISO(dateStr) {
    if (!dateStr) return '';
    // Try to parse dd/mm/yyyy format
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      if (year.length === 4) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    return dateStr; // fallback
  }

  // Escape HTML to prevent injection in product name
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
