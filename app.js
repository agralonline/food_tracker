document.getElementById('foodForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const data = document.getElementById('data').value;
  const prodotto = document.getElementById('prodotto').value;
  const quantita = document.getElementById('quantita').value || 'N/A';
  const scadenza = document.getElementById('scadenza').value;
  const scelta = document.getElementById('scelta').value;

  const table = getTableByScelta(scelta);
  const newRow = table.insertRow();
  newRow.innerHTML = `
    <td>${data}</td>
    <td>${prodotto}</td>
    <td>${quantita}</td>
    <td>${scadenza}</td>
  `;

  document.getElementById('dataContainer').style.display = 'block';
  document.getElementById('formContainer').style.display = 'none';
});

function getTableByScelta(scelta) {
  let table = document.getElementById(`${scelta.toLowerCase()}Table`);
  if (!table) {
    table = createTableForScelta(scelta);
  }
  return table;
}

function createTableForScelta(scelta) {
  const container = document.getElementById('tablesContainer');
  const tableContainer = document.createElement('div');
  tableContainer.id = `${scelta.toLowerCase()}Container`;

  const table = document.createElement('table');
  table.id = `${scelta.toLowerCase()}Table`;
  table.innerHTML = `
    <thead>
      <tr>
        <th>Data</th>
        <th>Prodotto</th>
        <th>Quantità</th>
        <th>Scadenza</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  tableContainer.appendChild(table);
  container.appendChild(tableContainer);

  return table;
}

document.getElementById('exportPdfBtn').addEventListener('click', function () {
  const element = document.getElementById('dataContainer');
  const options = {
    margin: 10,
    filename: 'food_tracker_data.pdf',
    image: { type: 'jpeg', quality: 1.0 },
    html2canvas: { scale: 4 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf(element, options);
});
