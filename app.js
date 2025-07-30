document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const btnAlimenti = document.getElementById('btnAlimenti');
  const btnTemperature = document.getElementById('btnTemperature');
  const sliderContainer = document.getElementById('sliderContainer');
  const roomSlider = document.getElementById('roomSlider');
  const roomLabel = document.getElementById('roomLabel');
  const formContainer = document.getElementById('formContainer');
  const dataContainer = document.getElementById('dataContainer');

  // Show Alimenti by default
  showAlimenti();

  // Toggle buttons
  btnAlimenti.addEventListener('click', () => {
    btnAlimenti.classList.add('active');
    btnTemperature.classList.remove('active');
    showAlimenti();
  });

  btnTemperature.addEventListener('click', () => {
    btnTemperature.classList.add('active');
    btnAlimenti.classList.remove('active');
    showTemperature();
  });

  // Slider change event to update label
  roomSlider.addEventListener('input', () => {
    const val = roomSlider.value;
    roomLabel.textContent = val === "0" ? "Sala" : "Cucina";
  });

  function showAlimenti() {
    sliderContainer.style.display = 'none';
    formContainer.style.display = 'block';
    dataContainer.style.display = 'block';
  }

  function showTemperature() {
    sliderContainer.style.display = 'flex';
    formContainer.style.display = 'none';
    dataContainer.style.display = 'none';
    // Initialize slider label and value
    roomSlider.value = "0";
    roomLabel.textContent = "Sala";
  }
});
