// app.js

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDwlEQZJmI3AEDJWCRtpKgBXBr1qD-4-Ow",
  authDomain: "jobhourstracker.firebaseapp.com",
  projectId: "jobhourstracker",
  storageBucket: "jobhourstracker.appspot.com",
  messagingSenderId: "401383939095",
  appId: "1:401383939095:web:e5e5c056a12fc47fd99052"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM Elements
const alimentiSection = document.getElementById("alimentiSection");
const temperatureSection = document.getElementById("temperatureSection");
const alimentiBtn = document.getElementById("alimentiBtn");
const temperatureBtn = document.getElementById("temperatureBtn");
const areaSelect = document.getElementById("areaSelect");
const salaTableDiv = document.getElementById("salaTable");
const cucinaTableDiv = document.getElementById("cucinaTable");
const exportTempPdfBtn = document.getElementById("exportTempPdfBtn");
const logoutBtn = document.getElementById("logoutBtn");
const themeToggle = document.getElementById("themeToggle");

// Theme Toggle
themeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark-theme", themeToggle.checked);
  localStorage.setItem("darkMode", themeToggle.checked);
});
if (localStorage.getItem("darkMode") === "true") {
  themeToggle.checked = true;
  document.body.classList.add("dark-theme");
}

// Section Switch
alimentiBtn.addEventListener("click", () => {
  alimentiSection.classList.remove("hidden");
  temperatureSection.classList.add("hidden");
});

temperatureBtn.addEventListener("click", () => {
  alimentiSection.classList.add("hidden");
  temperatureSection.classList.remove("hidden");
});

areaSelect.addEventListener("change", () => {
  salaTableDiv.classList.add("hidden");
  cucinaTableDiv.classList.add("hidden");
  exportTempPdfBtn.classList.add("hidden");

  const value = areaSelect.value;
  if (value === "sala") {
    salaTableDiv.classList.remove("hidden");
    exportTempPdfBtn.classList.remove("hidden");
  } else if (value === "cucina") {
    cucinaTableDiv.classList.remove("hidden");
    exportTempPdfBtn.classList.remove("hidden");
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.clear();
  location.reload();
});

// Generate Sala or Cucina table
function generateTemperatureTable(area) {
  const columns = area === "sala"
    ? ["Banco", "Bindi", "Vetrinetta", "Levissima", "Cantina Vini"]
    : ["Cucina", "Cucina 2", "Pizzeria", "Tavolo R1", "Tavolo R2", "Cella +", "Cella -"]

  const container = area === "sala" ? salaTableDiv : cucinaTableDiv;
  container.innerHTML = "";

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const headerRow = document.createElement("tr");
  ["Giorno", "Ora", "Operatore", ...columns].forEach(col => {
    const th = document.createElement("th");
    th.textContent = col;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  for (let i = 1; i <= 31; i++) {
    const row = document.createElement("tr");
    const giorno = document.createElement("td");
    giorno.textContent = i;
    row.appendChild(giorno);

    const ora = document.createElement("td");
    ora.innerHTML = `<input type="time" data-field="ora">`;
    row.appendChild(ora);

    const operatore = document.createElement("td");
    operatore.innerHTML = `<input type="text" data-field="operatore" list="operatoriList">`;
    row.appendChild(operatore);

    columns.forEach(col => {
      const cell = document.createElement("td");
      cell.innerHTML = `<input type="number" step="0.1" data-field="${col}">`;
      row.appendChild(cell);
    });

    tbody.appendChild(row);
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(table);

  // Load from Firebase
  loadTemperatureData(area);

  // Save on change
  table.addEventListener("change", () => saveTemperatureData(area));
}

function saveTemperatureData(area) {
  const table = (area === "sala" ? salaTableDiv : cucinaTableDiv).querySelector("table");
  const rows = table.querySelectorAll("tbody tr");
  const data = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    const giorno = parseInt(cells[0].textContent);
    const entry = { giorno };
    cells.forEach(cell => {
      const input = cell.querySelector("input");
      if (input) {
        const field = input.getAttribute("data-field");
        entry[field] = input.value;
      }
    });
    data.push(entry);
  });

  db.collection("temperature").doc(area).set({ data });
}

function loadTemperatureData(area) {
  db.collection("temperature").doc(area).get().then(doc => {
    if (doc.exists) {
      const entries = doc.data().data;
      const table = (area === "sala" ? salaTableDiv : cucinaTableDiv).querySelector("table");
      const rows = table.querySelectorAll("tbody tr");
      entries.forEach((entry, i) => {
        const cells = rows[i].querySelectorAll("td");
        cells.forEach(cell => {
          const input = cell.querySelector("input");
          if (input) {
            const field = input.getAttribute("data-field");
            if (entry[field]) input.value = entry[field];
          }
        });
      });
    }
  });
}

// Export PDF
function exportTableToPDF(selector, filename) {
  const element = document.querySelector(selector);
  html2pdf().from(element).set({
    margin: 0.5,
    filename: filename,
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
  }).save();
}

document.getElementById("exportPdfBtn").addEventListener("click", () => {
  exportTableToPDF("#foodTable", "alimenti.pdf");
});

document.getElementById("exportTempPdfBtn").addEventListener("click", () => {
  const area = areaSelect.value;
  if (area === "sala") exportTableToPDF("#salaTable", "temperature_sala.pdf");
  else if (area === "cucina") exportTableToPDF("#cucinaTable", "temperature_cucina.pdf");
});

// Generate operator list from previous
const datalist = document.createElement("datalist");
datalist.id = "operatoriList";
document.body.appendChild(datalist);

db.collection("temperature").get().then(snapshot => {
  const names = new Set();
  snapshot.forEach(doc => {
    doc.data().data.forEach(row => {
      if (row.operatore) names.add(row.operatore);
    });
  });
  names.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    datalist.appendChild(option);
  });
});

// Generate Sala/Cucina Tables initially
generateTemperatureTable("sala");
generateTemperatureTable("cucina");
