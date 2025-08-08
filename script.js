// Supabase Konfiguration
const supabaseUrl = 'https://peamqqtnyxcenycwjvrn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYW1xcXRueXhjZW55Y3dqdnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NjE5NzEsImV4cCI6MjA3MDIzNzk3MX0.w428iHM28kJuX_Hu6GkIZEPl76-iXlTHI0_Nfjw-6wc';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Nachricht speichern
async function sendMessageToSupabase(author, content) {
    const { error } = await supabase
        .from('messages')
        .insert([{ author, content }]);

    return !error;
}

// Galerie aktualisieren
async function updateGallery() {
    const container = document.getElementById('messagesContainer');
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

    if (error || !messages) {
        container.innerHTML = '<p>Fehler beim Laden der Nachrichten.</p>';
        return;
    }

    if (messages.length === 0) {
        container.innerHTML = '<p style="text-align:center;">Noch keine Nachrichten vorhanden.</p>';
        return;
    }

    container.innerHTML = '';

    messages.forEach((msg, index) => {
        const el = document.createElement('div');
        el.className = 'message-bottle';
        el.setAttribute('data-index', index);
        el.innerHTML = `
      <div class="bottle-preview">Von: ${escapeHtml(msg.author)}</div>
      <div class="bottle-content" id="content-${index}">
        <strong>Nachricht:</strong><br>
        ${escapeHtml(msg.content).replace(/\n/g, '<br>')}<hr>
        <small>Gefunden: ${new Date(msg.created_at).toLocaleString('de-DE')}</small>
      </div>`;

        el.addEventListener('click', () => toggleMessageContent(index));
        el.addEventListener('touchstart', () => el.style.transform = 'scale(1.01)');
        el.addEventListener('touchend', () => setTimeout(() => el.style.transform = '', 150));

        container.appendChild(el);
    });
}

function toggleMessageContent(index) {
    const content = document.getElementById(`content-${index}`);
    const visible = content.style.display === 'block';
    content.style.display = visible ? 'none' : 'block';
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

async function sendMessage() {
    const author = document.getElementById('authorName').value.trim();
    const content = document.getElementById('messageText').value.trim();

    if (!author || author.length < 2 || !content || content.length < 1) {
        showNotification('Bitte gültige Nachricht und Namen eingeben!', 'warning');
        return;
    }

    const success = await sendMessageToSupabase(author, content);

    if (success) {
        showBottleThrowAnimation();
        setTimeout(() => {
            closeMessageModal();
            showNotification('Deine Flaschenpost wurde ins Meer geworfen!', 'success');
            updateGallery();
        }, 1500);
    } else {
        showNotification('Fehler beim Senden der Nachricht!', 'error');
    }
}

function openMessageModal() {
    document.getElementById('messageModal').style.display = 'flex';
    setTimeout(() => document.getElementById('authorName').focus(), 100);
}

function closeMessageModal() {
    document.getElementById('messageModal').style.display = 'none';
    document.getElementById('authorName').value = '';
    document.getElementById('messageText').value = '';
}

function showBottleThrowAnimation() {
    const modal = document.querySelector('.message-paper');
    modal.style.animation = 'none';
    modal.offsetHeight;
    modal.style.animation = 'bottleThrow 1.5s ease-in-out';
    createConfetti();
}

function createConfetti() {
    const colors = ['#FFD700', '#FF6347', '#32CD32', '#FF69B4', '#00CED1'];
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-10px';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = '50%';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '4000';
            confetti.style.animation = `confettiFall ${2 + Math.random() * 2}s ease-in-out forwards`;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }, i * 50);
    }
}

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    const n = document.createElement('div');
    n.className = `notification notification-${type}`;
    n.textContent = message;
    Object.assign(n.style, {
        position: 'fixed', top: '80px', right: '20px', padding: '15px 20px',
        borderRadius: '10px', color: 'white', fontWeight: 'bold', fontSize: '14px',
        zIndex: '5000', maxWidth: '300px', animation: 'notificationSlide 0.3s ease-out'
    });
    n.style.background = type === 'success'
        ? 'linear-gradient(145deg, #32CD32, #228B22)'
        : 'linear-gradient(145deg, #4682B4, #2F4F4F)';
    document.body.appendChild(n);
    setTimeout(() => {
        n.style.animation = 'notificationSlideOut 0.3s ease-in forwards';
        setTimeout(() => n.remove(), 300);
    }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
    updateGallery();
});
