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



// डेटा लोड और इनिशियलाइज़ेशन
let savingsData = JSON.parse(localStorage.getItem('savingsData')) || {
    total: 0,
    history: [] // {date: '', amount: 0}
};

const target5Years = 20 * 365 * 5; // 5 साल का कुल टारगेट (न्यूनतम ₹36,500)

// DOM Elements
const dailyAmountInput = document.getElementById('dailyAmount');
const checkInBtn = document.getElementById('checkInBtn');
const totalSavedEl = document.getElementById('totalSaved');
const monthSavedEl = document.getElementById('monthSaved');
const progressPercentEl = document.getElementById('progressPercent');
const progressBar = document.getElementById('progressBar');
const attendanceLog = document.getElementById('attendanceLog');

// पेज लोड होने पर अपडेट करें
updateUI();

// अटेंडेंस बटन क्लिक इवेंट
checkInBtn.addEventListener('click', () => {
    const amount = parseFloat(dailyAmountInput.value) || 0;
    if (amount <= 0) {
        alert("कृपया एक वैध राशि दर्ज करें!");
        return;
    }

    const today = new Date().toLocaleDateString('hi-IN', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    // आज की तारीख में पहले से अटेंडेंस तो नहीं लगी?
    const alreadyDone = savingsData.history.some(entry => entry.date === today);
    if (alreadyDone) {
        if (!confirm("आप आज की अटेंडेंस पहले ही लगा चुके हैं। क्या आप एक और एंट्री जोड़ना चाहते हैं?")) {
            return;
        }
    }

    // डेटा अपडेट करें
    savingsData.total += amount;
    savingsData.history.unshift({ date: today, amount: amount });
    
    // लोकल स्टोरेज में सेव करें
    localStorage.setItem('savingsData', JSON.stringify(savingsData));
    
    updateUI();
});

// UI अपडेट करने का फंक्शन
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

    // प्रोग्रेस प्रतिशत
    const percent = Math.min(((savingsData.total / target5Years) * 100), 100).toFixed(2);
    progressPercentEl.textContent = `${percent}%`;
    progressBar.style.width = `${percent}%`;

    // लॉग रेंडर करना
    attendanceLog.innerHTML = '';
    savingsData.history.forEach(entry => {
        const li = document.createElement('li');
        li.innerHTML = `<span>📅 ${entry.date}</span> <strong>₹${entry.amount} [✓]</strong>`;
        attendanceLog.appendChild(li);
    });
}

// --- डिजिटल सिग्नेचर कैनवास लॉजिक ---
const canvas = document.getElementById('sigCanvas');
const ctx = canvas.getContext('2d');
let drawing = false;

canvas.addEventListener('mousedown', () => drawing = true);
canvas.addEventListener('mouseup', () => { drawing = false; ctx.beginPath(); });
canvas.addEventListener('mousemove', draw);

// मोबाइल टच सपोर्ट
canvas.addEventListener('touchstart', (e) => { drawing = true; e.preventDefault(); });
canvas.addEventListener('touchend', () => { drawing = false; ctx.beginPath(); });
canvas.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    draw({ clientX: touch.clientX, clientY: touch.clientY });
});

function draw(e) {
    if (!drawing) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2c3e50';

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

document.getElementById('clearSigBtn').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});