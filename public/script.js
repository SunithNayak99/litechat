const socket = io();
const username = localStorage.getItem('username');
socket.emit('set name', username);

let localStream;
let remoteStream;
let peerConnection;

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
});

socket.on('paired', async ({ id, name }) => {
    chatMessages.innerHTML = `<p>Connected to Stranger</p>`;
    createPeerConnection();
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
});

socket.on('stranger left', () => {
    chatMessages.innerHTML = `<p>Stranger disconnected. Waiting for new one...</p>`;
    closeConnection();
});

socket.on('chat message', (data) => {
    appendMessage(`Stranger: ${data.message}`);
});

socket.on('video-offer', async (data) => {
    createPeerConnection();
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('video-answer', { answer });
});

socket.on('video-answer', async (data) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on('ice-candidate', (data) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
});

function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
        appendMessage(`You: ${message}`);
        socket.emit('chat message', { message });
        chatInput.value = '';
    }
}

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function appendMessage(msg) {
    const div = document.createElement('div');
    div.innerText = msg;
    chatMessages.appendChild(div);
}

function createPeerConnection() {
    peerConnection = new RTCPeerConnection();
    peerConnection.onicecandidate = (e) => {
        if (e.candidate) socket.emit('ice-candidate', { candidate: e.candidate });
    };
    peerConnection.ontrack = (e) => {
        remoteVideo.srcObject = e.streams[0];
    };
    peerConnection.createOffer().then(offer => {
        peerConnection.setLocalDescription(offer);
        socket.emit('video-offer', { offer });
    });
}

function closeConnection() {
    peerConnection && peerConnection.close();
    peerConnection = null;
    remoteVideo.srcObject = null;
}

function skipStranger() {
    socket.emit('skip');
    closeConnection();
}
