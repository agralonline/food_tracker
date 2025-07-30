// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', function () {
  // Set today's date in DD/MM/YYYY format
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;
  document.getElementById('data').value = formattedDate;

  // Load saved items from localStorage
  loadDataFromLocalStorage();

  // Handle form submission
  document.getElementById('foodForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const data = document.getElementById('data').value;
    const prodotto = document.getElementById('prodotto').value;
    const quantita = document.getElementById('quantita').value || 'N/A';
    const scadenza = document.getElementById('scadenza').value;
    const scelta = document.getElementById('scelta').value;

    // Add new row to the table
    addRowToTable(data, prodotto, quantita, scelta, scadenza);

    // Save updated data to localStorage
    saveDataToLocalStorage();

    // Reset form fields
    document.getElementById('foodForm').reset();
  });
});

// Add a new row to the table
function addRowToTable(data, prodotto, quantita, scelta, scadenza) {
  const table = document.getElementById('foodTable').getElementsByTagName('tbody')[0];
  const newRow = table.insertRow();
  newRow.innerHTML = `
    <td>${data}</td>
    <td>${prodotto}</td>
    <td>${quantita}</td>
    <td>${scelta}</td>
    <td>${scadenza}</td>
  `;
  groupEntriesByScelta();
}

// Group entries by 'Scelta' and display them
function groupEntriesByScelta() {
  const table = document.getElementById('foodTable');
  const rows = table.getElementsByTagName('tbody')[0].rows;

  const groups = {
    'Sottovuoto': [],
    'Abbattuto -18°': [],
    'Decongelato': []
  };

  // Group rows based on 'Scelta'
  for (let i = 0; i < rows.length; i++) {
    const scelta = rows[i].cells[3].textContent;
    groups[scelta].push(rows[i]);
  }

  // Clear the table
  table.getElementsByTagName('tbody')[0].innerHTML = '';

  // Append grouped rows back to the table
  for (const group in groups) {
    if (groups[group].length > 0) {
      const groupHeader = document.createElement('tr');
      groupHeader.innerHTML = `<td colspan="5"><strong>${group}</strong></td>`;
      table.getElementsByTagName('tbody')[0].appendChild(groupHeader);

      groups[group].forEach(row => {
        table.getElementsByTagName('tbody')[0].appendChild(row);
      });
    }
  }
}

// Save data to localStorage
function saveDataToLocalStorage() {
  const rows = document.querySelectorAll('#foodTable tbody tr');
  const items = Array.from(rows).map(row => {
    return {
      data: row.cells[0].textContent,
      prodotto: row.cells[1].textContent,
      quantita: row.cells[2].textContent,
      scelta: row.cells[3].textContent,
      scadenza: row.cells[4].textContent
    };
  });
  localStorage.setItem('foodItems', JSON.stringify(items));
}

// Load data from localStorage
function loadDataFromLocalStorage() {
  const savedItems = JSON.parse(localStorage.getItem('foodItems'));
  if (savedItems) {
    savedItems.forEach(item => {
      addRowToTable(item.data, item.prodotto, item.quantita, item.scelta, item.scadenza);
    });
  }
}
