const socket = io(); // Connect to the socket.io server
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');
const chatBox = document.getElementById('chat-box');

let userName = '';

// Prompt user for their name
while (!userName) {
    userName = prompt('Enter your name:').trim();
}
alert(`Welcome, ${userName}!`);

// Function to append a message to the chat
function appendMessage(name, message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', type); // 'sent' or 'received'

    const nameDiv = document.createElement('div');
    nameDiv.classList.add('name');
    nameDiv.innerText = name;

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('content');
    contentDiv.innerText = message;

    messageDiv.appendChild(nameDiv);
    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);

    // Scroll to the bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Sending a message
sendButton.addEventListener('click', () => {
    const message = messageInput.value.trim(); // Get the input value and trim any whitespace
    if (message) {
        appendMessage(userName, message, 'sent'); // Add to UI as 'sent'
        socket.emit('chat message', { name: userName, message }); // Send to server
        messageInput.value = ''; // CLEAR the input field after sending
        messageInput.focus(); // Optional: Bring focus back to the input field
    }
});


// Receiving a message
socket.on('chat message', (data) => {
    appendMessage(data.name, data.message, 'received'); // Add to UI as 'received'
});
