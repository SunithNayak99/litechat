const socket = io();
const username = localStorage.getItem('username') || 'Guest';

const chatBox = document.getElementById('chat-box');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let peerConnection;
let strangerId;

socket.emit('set name', username);

socket.on('paired', (id) => {
    strangerId = id;
    startVideoCall();
});

socket.on('chat message', ({ message }) => {
    appendMessage('Stranger', message);
});

socket.on('video-offer', async ({ offer }) => {
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('video-answer', { to: strangerId, answer });
});

socket.on('video-answer', async ({ answer }) => {
    await peerConnection.setRemoteDescription(answer);
});

socket.on('ice-candidate', async (candidate) => {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on('partner left', () => {
    alert('Stranger left. Searching for new stranger...');
    resetCall();
});

async function startVideoCall() {
    peerConnection = new RTCPeerConnection();
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    localVideo.srcObject = stream;
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    peerConnection.onicecandidate = ({ candidate }) => {
        if (candidate) socket.emit('ice-candidate', { to: strangerId, candidate });
    };

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('video-offer', { to: strangerId, offer });
}

function appendMessage(sender, message) {
    const msg = document.createElement('div');
    msg.className = 'message';
    msg.innerText = `${sender}: ${message}`;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    if (message) {
        appendMessage('You', message);
        socket.emit('chat message', { to: strangerId, message });
        input.value = '';
    }
}

function skip() {
    socket.emit('skip');
    resetCall();
}

function resetCall() {
    if (peerConnection) peerConnection.close();
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
}
