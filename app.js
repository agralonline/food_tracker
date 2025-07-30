document.getElementById('foodForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const data = document.getElementById('data').value;
  const prodotto = document.getElementById('prodotto').value;
  const quantita = document.getElementById('quantita').value || 'N/A';
  const scadenza = document.getElementById('scadenza').value;
  const scelta = document.getElementById('scelta').value;

  // Add new row to the table
  const table = document.getElementById('foodTable').getElementsByTagName('tbody')[0];
  const newRow = table.insertRow();
  newRow.innerHTML = `
    <td>${data}</td>
    <td>${prodotto}</td>
    <td>${quantita}</td>
    <td>${scelta}</td>
    <td>${scadenza}</td>
  `;

  // Reset form fields
  document.getElementById('foodForm').reset();

  // Keep the form visible for adding more items
  document.getElementById('formContainer').style.display = 'block';
  document.getElementById('dataContainer').style.display = 'block';
});
