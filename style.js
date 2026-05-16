// Automatically load saved data from LocalStorage databases on launch
let questions = JSON.parse(localStorage.getItem('quiz_questions')) || [];
let records = JSON.parse(localStorage.getItem('quiz_records')) || [];
let currentStudent = "";

const PASSCODE = "Winners2026";

// Run initial system renders to load saved database inputs straight away
window.onload = function() {
    renderAdminQuestions();
    renderQuiz();
};

// Layout Tab Controllers
function showTab(id) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(id).classList.add('active');
    if (id === 'student') document.getElementById('btn-portal').classList.add('active');
    if (id === 'admin') document.getElementById('btn-admin').classList.add('active');
}

// Admin Panel Sub-tab management
function showAdminSub(id) {
    document.getElementById('sub-manage').classList.add('hidden');
    document.getElementById('sub-dashboard').classList.add('hidden');
    document.getElementById('nav-manage').classList.remove('active-sub');
    document.getElementById('nav-dashboard').classList.remove('active-sub');
    
    document.getElementById('sub-' + id).classList.remove('hidden');
    document.getElementById('nav-' + id).classList.add('active-sub');
    if(id === 'dashboard') renderRecords();
}

function adminLogin() {
    if(document.getElementById('adminPass').value === PASSCODE) {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
    } else { 
        alert("Wrong Passcode"); 
    }
}

function toggleInputs() {
    const type = document.getElementById('qType').value;
    document.getElementById('mcq-options').classList.toggle('hidden', type !== 'mcq');
    document.getElementById('tf-options').classList.toggle('hidden', type !== 'tf');
}

// Database Actions: Create and Save Question Data
function saveQuestion() {
    const text = document.getElementById('qText').value;
    const type = document.getElementById('qType').value;

    if(text.trim() === "") {
        alert("Please enter question content!");
        return;
    }

    let questionObj = { text, type };

    if(type === 'mcq') {
        const opts = Array.from(document.querySelectorAll('.opt')).map((i, index) => i.value.trim() || `Option ${index + 1}`);
        const correctIdx = document.querySelector('input[name="correct"]:checked').value;
        questionObj.options = opts;
        questionObj.correct = opts[correctIdx];
    } else {
        questionObj.correct = document.querySelector('input[name="correct-tf"]:checked').value;
    }

    // Push into array and sync with LocalStorage
    questions.push(questionObj);
    localStorage.setItem('quiz_questions', JSON.stringify(questions));
    
    // Clear dynamic creation fields
    document.getElementById('qText').value = "";
    document.querySelectorAll('.opt').forEach(input => input.value = "");
    
    renderAdminQuestions();
    renderQuiz();
    alert("Question safely saved to live quiz data!");
}

function renderAdminQuestions() {
    const list = document.getElementById('admin-questions-list');
    if(questions.length === 0) {
        list.innerHTML = `<p style="opacity:0.5; font-size:0.9rem;">No active questions loaded yet.</p>`;
        return;
    }
    list.innerHTML = questions.map((q, i) => `
        <div class="quiz-card">
            <button onclick="deleteQuestion(${i})" style="float:right; background:none; border:none; color:var(--danger); cursor:pointer; font-size:1.1rem;">❌</button>
            <strong>Q${i+1}: ${q.text}</strong><br>
            <small style="color:var(--accent);">Correct Answer: ${q.correct}</small>
        </div>
    `).join('');
}

function deleteQuestion(i) {
    if(confirm("Permanently delete this question from the database?")) {
        questions.splice(i, 1);
        localStorage.setItem('quiz_questions', JSON.stringify(questions));
        renderAdminQuestions();
        renderQuiz();
    }
}

// Student Environment Methods
function startQuiz() {
    currentStudent = document.getElementById('studentName').value.trim();
    if(!currentStudent) return alert("Please type your name before clicking start!");
    
    document.getElementById('student-auth').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    document.getElementById('display-student-name').innerText = "Student: " + currentStudent;
    
    renderQuiz();
}

function renderQuiz() {
    const container = document.getElementById('questions-container');
    if(questions.length === 0) {
        container.innerHTML = `<p style="opacity: 0.7; text-align: center;">No active quizzes. Please check back later.</p>`;
        return;
    }
    
    container.innerHTML = questions.map((q, i) => `
        <div class="quiz-card">
            <p style="font-weight: bold; margin-top: 0;">${i+1}. ${q.text}</p>
            ${q.type === 'mcq' ? 
                q.options.map(opt => `
                    <label class="student-option">
                        <input type="radio" name="q${i}" value="${opt}" style="width:auto; margin-right:8px;"> ${opt}
                    </label>
                `).join('') :
                `<label class="student-option">
                    <input type="radio" name="q${i}" value="True" style="width:auto; margin-right:8px;"> True
                 </label>
                 <label class="student-option">
                    <input type="radio" name="q${i}" value="False" style="width:auto; margin-right:8px;"> False
                 </label>`
            }
        </div>
    `).join('');
}

function submitQuiz() {
    let score = 0;
    
    questions.forEach((q, i) => {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        if(selected && selected.value === q.correct) {
            score++;
        }
    });

    const percent = Math.round((score / questions.length) * 100) || 0;
    
    // Save record with current timestamp 
    const timeStamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    records.push({ name: currentStudent, score: percent + "%", date: timeStamp });
    localStorage.setItem('quiz_records', JSON.stringify(records));
    
    alert(`Quiz Completed! ${currentStudent}, your score is: ${percent}%`);
    
    // Smooth reset for the next user without hard page reloads wiping memories
    currentStudent = "";
    document.getElementById('studentName').value = "";
    document.getElementById('quiz-area').classList.add('hidden');
    document.getElementById('student-auth').classList.remove('hidden');
    
    renderRecords();
}

function renderRecords() {
    const list = document.getElementById('records-list');
    if(records.length === 0) {
        list.innerHTML = `<p style="opacity:0.5; font-size:0.9rem;">No student performance logs found.</p>`;
        return;
    }
    list.innerHTML = records.map(r => `
        <div class="quiz-card">
            <strong>${r.name}</strong> 
            <span style="float: right; color: var(--accent); font-weight: bold;">${r.score}</span><br>
            <small style="opacity:0.5;">Completed at: ${r.date}</small>
        </div>
    `).join('');
}

function clearRecords() {
    if(confirm("Are you sure you want to clear all student records from the dashboard?")) {
        records = [];
        localStorage.removeItem('quiz_records');
        renderRecords();
    }
}
