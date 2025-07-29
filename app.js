import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDwlEQZJmI3AEDJWCRtpKgBXBr1qD-4-Ow",
  authDomain: "jobhourstracker.firebaseapp.com",
  projectId: "jobhourstracker",
  storageBucket: "jobhourstracker.firebasestorage.app",
  messagingSenderId: "401383939095",
  appId: "1:401383939095:web:e5e5c056a12fc47fd99052"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const hoursCollection = collection(db, "hours");

const form = document.getElementById("hoursForm");
const tbody = document.querySelector("tbody");
const dateInput = document.getElementById("date");
const themeToggle = document.getElementById("theme-toggle");
const monthlyTotalEl = document.getElementById("monthlyTotal");

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  dateInput.value = today;
  loadEntries();
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newEntry = {
    date: dateInput.value,
    checkin1: form.checkin1.value,
    checkout1: form.checkout1.value,
    checkin2: form.checkin2.value,
    checkout2: form.checkout2.value,
  };

  await addDoc(hoursCollection, newEntry);
  form.reset();
  dateInput.value = new Date().toISOString().split("T")[0];
  loadEntries();
});

async function loadEntries() {
  const snapshot = await getDocs(hoursCollection);
  const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  tbody.innerHTML = "";
  let monthlyMinutes = 0;

  entries.sort((a, b) => new Date(b.date) - new Date(a.date));

  entries.forEach(entry => {
    const tr = document.createElement("tr");

    const dailyMinutes = calculateDailyMinutes(entry);
    monthlyMinutes += dailyMinutes;

    tr.innerHTML = `
      <td>${formatDate(entry.date)}</td>
      <td>${entry.checkin1 || "--:--"}</td>
      <td>${entry.checkout1 || "--:--"}</td>
      <td>${entry.checkin2 || "--:--"}</td>
      <td>${entry.checkout2 || "--:--"}</td>
      <td>${formatMinutes(dailyMinutes)}</td>
      <td>
        <button onclick="deleteEntry('${entry.id}')">🗑️</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  monthlyTotalEl.textContent = formatMinutes(monthlyMinutes);
}

function calculateDailyMinutes(entry) {
  return (
    calculateMinutes(entry.checkin1, entry.checkout1) +
    calculateMinutes(entry.checkin2, entry.checkout2)
  );
}

function calculateMinutes(start, end) {
  if (!start || !end) return 0;
  const [h1, m1] = start.split(":").map(Number);
  const [h2, m2] = end.split(":").map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}

function formatMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

window.deleteEntry = async (id) => {
  await deleteDoc(doc(hoursCollection, id));
  loadEntries();
};
