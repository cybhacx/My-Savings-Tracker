// Firebase Configuration Data
const firebaseConfig = {
  apiKey: "AIzaSyCbEMVKDY0Smsjgisw2oDVmRFhSjW8vz0",
  authDomain: "my-savings-tracker-1f53d.firebaseapp.com",
  projectId: "my-savings-tracker-1f53d",
  storageBucket: "my-savings-tracker-1f53d.firebasestorage.app",
  messagingSenderId: "711855188718",
  appId: "1:711855188718:web:b02dcfd3fe1fc4295121ff"
};

// Initialize Firebase (Compat Version)
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// डेटा लोड और इनिशियलाइजेशन (लोकल स्टोरेज से बैकअप)
let savingsData = JSON.parse(localStorage.getItem('savingsData')) || {
  total: 0,
  history: []
};

const target5Years = 20 * 365 * 5; // 5 साल का कुल टारगेट (₹36,500)

// DOM Elements
const dailyAmountInput = document.getElementById('dailyAmount');
const checkInBtn = document.getElementById('checkInBtn');
const totalSavedEl = document.getElementById('totalSaved');
const monthSavedEl = document.getElementById('monthSaved');
const progressPercentEl = document.getElementById('progressPercent');
const progressBar = document.getElementById('progressBar');
const attendanceLog = document.getElementById('attendanceLog');

// पेज लोड होते ही स्क्रीन पर पुराना डेटा दिखाने के लिए
updateUI();

// --- अटेंडेंस बटन क्लिक इवेंट ---
checkInBtn.addEventListener('click', () => {
  const amount = parseFloat(dailyAmountInput.value) || 0;
  if (amount <= 0) {
    alert("कृपया एक वैध राशि दर्ज करें!");
    return;
  }

  const today = new Date().toLocaleDateString('hi-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // चेक करें कि आज की अटेंडेंस पहले ही तो नहीं लग चुकी
  const alreadyDone = savingsData.history.some(entry => entry.date === today);
  if (alreadyDone) {
    if (!confirm("आप आज की अटेंडेंस पहले ही लगा चुके हैं। क्या आप एक और एंट्री जोड़ना चाहते हैं?")) {
      return;
    }
  }

  const newEntry = { date: today, amount: amount };

  // 1. लोकल स्टोरेज में डेटा सेव करें
  savingsData.total += amount;
  savingsData.history.unshift(newEntry);
  localStorage.setItem('savingsData', JSON.stringify(savingsData));

  // 2. फायरबेस क्लाउड डेटाबेस (Realtime Database) में डेटा भेजें
  database.ref('savings_history').push(newEntry);
  database.ref('total_savings').set(savingsData.total);

  // स्क्रीन को अपडेट करें
  updateUI();
});

// --- UI (स्क्रीन) अपडेट करने का फंक्शन ---
function updateUI() {
  totalSavedEl.textContent = `₹${savingsData.total}`;

  // वर्तमान महीने की बचत की गणना
  const currentMonth = new Date().toLocaleDateString('hi-IN', { month: 'long', year: 'numeric' });
  let monthTotal = 0;
  savingsData.history.forEach(entry => {
    if (entry.date.includes(currentMonth.split(' ')[0])) {
      monthTotal += entry.amount;
    }
  });
  monthSavedEl.textContent = `₹${monthTotal}`;

  // प्रोग्रेस बार प्रतिशत सेट करना
  const percent = Math.min((savingsData.total / target5Years) * 100, 100).toFixed(2);
  progressPercentEl.textContent = `${percent}%`;
  progressBar.style.width = `${percent}%`;

  // स्क्रीन पर पुराने लॉग्स (इतिहास) रेंडर करना
  attendanceLog.innerHTML = '';
  savingsData.history.forEach(entry => {
    const li = document.createElement('li'); // यहाँ नंबर 11 वाला एरर फिक्स किया गया है
    li.innerHTML = `<span>${entry.date}</span> - <strong>₹${entry.amount} [✓]</strong>`;
    attendanceLog.appendChild(li);
  });
}

// --- डिजिटल सिग्नेचर कैनवास लॉजिक ---
const canvas = document.getElementById('sigCanvas');
const clearSigBtn = document.getElementById('clearSigBtn');

if (canvas) {
  const ctx = canvas.getContext('2d');
  let drawing = false;

  // माउस इवेंट्स (कंप्यूटर के लिए)
  canvas.addEventListener('mousedown', () => drawing = true);
  canvas.addEventListener('mouseup', () => { drawing = false; ctx.beginPath(); });
  canvas.addEventListener('mousemove', draw);

  // टच इवेंट्स (मोबाइल स्क्रीन के लिए)
  canvas.addEventListener('touchstart', (e) => { drawing = true; e.preventDefault(); });
  canvas.addEventListener('touchend', () => { drawing = false; ctx.beginPath(); });
  canvas.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    if (!drawing) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  });

  function draw(e) {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  // सिग्नेचर साफ़ करने का बटन
  clearSigBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}