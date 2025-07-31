// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAVmsiSzszfgCEk5qqnX57pGigoQtUafAU",
  authDomain: "food-tracker-fca47.firebaseapp.com",
  projectId: "food-tracker-fca47",
  storageBucket: "food-tracker-fca47.firebasestorage.app",
  messagingSenderId: "769456892190",
  appId: "1:769456892190:web:9c2a2e7d676f1f2d85010f"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM Elements
const loginModal = document.getElementById('loginModal');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

const showAlimentiBtn = document.getElementById('showAlimentiBtn');
const showTemperatureBtn = document.getElementById('showTemperatureBtn');

const alimentiSection = document.getElementById('alimentiSection');
const temperatureSection = document.getElementById('temperatureSection');

const alimentiForm = document.getElementById('alimentiForm');
const nomeInput = document.getElementById('nomeInput');
const dataPreparazioneInput = document.getElementById('dataPreparazioneInput');
const dataScadenzaInput = document.getElementById('dataScadenzaInput');

const alimentiTableBody = document.querySelector('#alimentiTable tbody');
const exportAlimentiBtn = document.getElementById('exportAlimentiBtn');

const showSalaBtn = document.getElementById('showSalaBtn');
const showCucinaBtn = document.getElementById('showCucinaBtn');

const salaContainer = document.getElementById('salaContainer');
const cucinaContainer = document.getElementById('cucinaContainer');

const salaTableBody = document.querySelector('#salaTable tbody');
const cucinaTableBody = document.querySelector('#cucinaTable tbody');

const exportSalaBtn = document.getElementById('exportSalaBtn');
const exportCucinaBtn = document.getElementById('exportCucinaBtn');

const themeToggleBtn = document.getElementById('themeToggleBtn');

// --- Authentication ---
// Simple demo login, replace with real auth if needed
const DEMO_USERNAME = 'Admin';
const DEMO_PASSWORD = 'Miraggio@46';

function checkLogin() {
  return localStorage.getItem('loggedIn') === 'true';
}
function showLogin(show) {
  loginModal.style.display = show ? 'flex' : 'none';
}

function login(username, password) {
  if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
    localStorage.setItem('loggedIn', 'true');
    showLogin(false);
    logoutBtn.classList.remove('hidden');
    loadAlimenti();
    loadTemperature();
  } else {
    loginError.textContent = 'Username o password errati.';
  }
}

function logout() {
  localStorage.removeItem('loggedIn');
  location.reload();
}

loginBtn.addEventListener('click', () => {
  login(loginModal.querySelector('#username').value.trim(), loginModal.querySelector('#password').value);
});
logoutBtn.addEventListener('click', logout);

// If not logged in, show login modal
if (!checkLogin()) {
  showLogin(true);
} else {
  logoutBtn.classList.remove('hidden');
  loadAlimenti();
  loadTemperature();
}

// --- Theme Toggle ---
function setTheme(theme) {
  if (theme === 'dark') {
    document.body.style.backgroundColor = '#222';
    document.body.style.color = '#eee';
  } else {
    document.body.style.backgroundColor = '#fefefe';
    document.body.style.color = '#222';
  }
  localStorage.setItem('theme', theme);
}

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = localStorage.getItem('theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
});

// On load, set theme
setTheme(localStorage.getItem('theme') || 'light');

// --- Show / Hide Sections ---
showAlimentiBtn.addEventListener('click', () => {
  showSection('alimenti');
});
showTemperatureBtn.addEventListener('click', () => {
  showSection('temperature');
});

function showSection(section) {
  if (section === 'alimenti') {
    alimentiSection.classList.remove('hidden');
    temperatureSection.classList.add('hidden');
    showAlimentiBtn.classList.add('active');
    showTemperatureBtn.classList.remove('active');
  } else {
    alimentiSection.classList.add('hidden');
    temperatureSection.classList.remove('hidden');
    showAlimentiBtn.classList.remove('active');
    showTemperatureBtn.classList.add('active');
  }
}

// --- Alimenti CRUD ---

let alimentiData = [];
let editingAlimentoId = null;

// Load aliment
