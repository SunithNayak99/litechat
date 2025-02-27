const socket = io();
let username = '';
let paired = false;

const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');
const chatBox = document.getElementById('chat-box');
const chatContainer = document.querySelector('.chat-container');
const nameOverlay = document.getElementById('name-overlay');
const modeBtn = document.getElementById('mode-btn');

function enterChat() {
    username = document.getElementById('username').value.trim();
    if (username) {
        nameOverlay.style.display = 'none';
        chatContainer.style.display = 'flex';
        socket.emit('set name', username);
    }
}

function appendMessage(message, type = 'received') {
    const div = document.createElement('div');
    div.classList.add('message', type);
    div.innerText = message;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function setWaiting() {
    chatBox.innerHTML = '<div class="waiting-animation">🔗 Connecting to a random user...</div>';
}

socket.on('paired', () => {
    paired = true;
    chatBox.innerHTML = ''; // Clear waiting
    appendMessage('🎉 Connected to a stranger!', 'system');
});

socket.on('partner left', () => {
    paired = false;
    appendMessage('⚠️ Partner disconnected. Finding a new partner...', 'system');
    setTimeout(() => {
        setWaiting();
        socket.emit('set name', username); // Re-announce after disconnect
    }, 2000);
});

sendButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message && paired) {
        appendMessage(`You: ${message}`, 'sent');
        socket.emit('chat message', message);
        messageInput.value = '';
    }
});

socket.on('chat message', (message) => {
    appendMessage(`Stranger: ${message}`, 'received');
});

modeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    modeBtn.innerText = document.body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌙 Dark Mode';
});
