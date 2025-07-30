let currentCategory = '';

document.getElementById('btnPreparazione').addEventListener('click', function() {
  currentCategory = 'Preparazione';
  showForm();
});

document.getElementById('btnSottovuoto').addEventListener('click', function() {
  currentCategory = 'Sottovuoto';
  showForm();
});

document.getElementById('btnAbbattuto').addEventListener('click', function() {
  currentCategory = 'Abbattuto -18°';
  showForm();
});

document.getElementById('btnDecongelato').addEventListener('click', function() {
  currentCategory = 'Decongelato';
  showForm();
});

function showForm() {
  document.getElementById('formContainer').style.display = 'block';
  document.getElementById('foodForm').reset();
}

document.getElementById('foodForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const data = document.getElementById('data').value;
  const prodotto = document.getElementById('prodotto').value;
  const quantita = document.getElementById('quantita').value || 'N/A';
  const scadenza = document.getElementById('scadenza').value;

  const table = document.getElementById(`${currentCategory.toLowerCase()}Table`).getElementsByTagName('tbody')[0];
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
