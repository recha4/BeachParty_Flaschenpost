// Supabase Konfiguration
const supabaseUrl = 'https://peamqqtnyxcenycwjvrn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYW1xcXRueXhjZW55Y3dqdnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NjE5NzEsImV4cCI6MjA3MDIzNzk3MX0.w428iHM28kJuX_Hu6GkIZEPl76-iXlTHI0_Nfjw-6wc';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey); // FIX: window.supabase

// Nachricht zu Supabase senden
async function sendMessageToSupabase(author, content) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert([{ author, content }]);

        if (error) {
            console.error('Supabase Error:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('JavaScript Error:', err);
        return false;
    }
}

// Nachrichten aus Supabase laden
async function loadMessagesFromSupabase() {
    try {
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Load Error:', error);
            return [];
        }
        return messages || [];
    } catch (err) {
        console.error('Load JavaScript Error:', err);
        return [];
    }
}

// Gallery aktualisieren
async function updateGallery() {
    const container = document.getElementById('messagesContainer');

    // Loading-Indikator anzeigen
    container.innerHTML = '<p style="text-align:center; color: #8B4513;">Lade Nachrichten...</p>';

    const messages = await loadMessagesFromSupabase();

    if (messages.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #8B4513; font-style: italic;">
                <div style="font-size: 48px; margin-bottom: 20px;">Leer</div>
                <p>Noch keine Flaschenposte gefunden...</p>
                <p style="font-size: 12px; margin-top: 10px;">Sei der erste, der eine Nachricht hinterlässt!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    messages.forEach((message, index) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-bottle';
        messageDiv.setAttribute('data-index', index);

        // Zeitformatierung
        const messageDate = new Date(message.created_at);
        const timeString = messageDate.toLocaleString('de-DE');

        messageDiv.innerHTML = `
            <div class="bottle-preview">Von: ${escapeHtml(message.author)}</div>
            <div class="bottle-content" id="content-${index}">
                <strong>Nachricht:</strong><br>
                ${escapeHtml(message.content).replace(/\n/g, '<br>')}
                <hr>
                <small>Gefunden: ${timeString}</small>
            </div>
        `;

        messageDiv.addEventListener('click', () => toggleMessageContent(index));

        // Touch-Effekte für Mobile
        messageDiv.addEventListener('touchstart', function () {
            this.style.transform = 'translateY(-3px) scale(1.01)';
        });

        messageDiv.addEventListener('touchend', function () {
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });

        container.appendChild(messageDiv);
    });
}

// Nachrichten-Inhalt ein/ausblenden
function toggleMessageContent(index) {
    const content = document.getElementById(`content-${index}`);
    const isVisible = content.style.display === 'block';

    if (!isVisible) {
        content.style.display = 'block';
        content.style.animation = 'contentSlideDown 0.3s ease forwards';
    } else {
        content.style.animation = 'contentSlideUp 0.3s ease forwards';
        setTimeout(() => {
            content.style.display = 'none';
        }, 300);
    }

    // Vibration feedback
    if (navigator.vibrate) {
        navigator.vibrate(30);
    }
}

// HTML escaping für Sicherheit
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Nachricht senden
async function sendMessage() {
    const author = document.getElementById('authorName').value.trim();
    const content = document.getElementById('messageText').value.trim();

    // Validierung
    if (!author || author.length < 2 || !content || content.length < 1) {
        showNotification('Bitte gültige Nachricht und Namen eingeben!', 'warning');
        return;
    }

    // Loading-Indikator
    const sendBtn = document.querySelector('.btn-send');
    const originalText = sendBtn.textContent;
    sendBtn.textContent = 'Wird gesendet...';
    sendBtn.disabled = true;

    const success = await sendMessageToSupabase(author, content);

    // Button zurücksetzen
    sendBtn.textContent = originalText;
    sendBtn.disabled = false;

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

// Modal-Funktionen
function openMessageModal() {
    document.getElementById('messageModal').style.display = 'flex';
    setTimeout(() => document.getElementById('authorName').focus(), 100);

    // Hide scroll hint and mobile arrow
    const scrollHint = document.querySelector('.scroll-hint');
    const mobileArrow = document.querySelector('.mobile-arrow');
    if (scrollHint) scrollHint.style.display = 'none';
    if (mobileArrow) mobileArrow.style.display = 'none';
}

function closeMessageModal() {
    document.getElementById('messageModal').style.display = 'none';
    document.getElementById('authorName').value = '';
    document.getElementById('messageText').value = '';

    // Show scroll hint and mobile arrow again
    const scrollHint = document.querySelector('.scroll-hint');
    const mobileArrow = document.querySelector('.mobile-arrow');
    if (scrollHint && window.innerWidth > 768) scrollHint.style.display = 'block';
    if (mobileArrow && window.innerWidth <= 768) mobileArrow.style.display = 'flex';
}

function openGallery() {
    document.getElementById('galleryModal').style.display = 'flex';
    updateGallery();

    // Hide scroll hint and mobile arrow
    const scrollHint = document.querySelector('.scroll-hint');
    const mobileArrow = document.querySelector('.mobile-arrow');
    if (scrollHint) scrollHint.style.display = 'none';
    if (mobileArrow) mobileArrow.style.display = 'none';
}

function closeGallery() {
    document.getElementById('galleryModal').style.display = 'none';

    // Show scroll hint and mobile arrow again if not scrolled to bottle
    const container = document.querySelector('.beach-container');
    if (container.scrollLeft < window.innerWidth * 0.6) {
        const scrollHint = document.querySelector('.scroll-hint');
        const mobileArrow = document.querySelector('.mobile-arrow');
        if (scrollHint && window.innerWidth > 768) scrollHint.style.display = 'block';
        if (mobileArrow && window.innerWidth <= 768) mobileArrow.style.display = 'flex';
    }
}

// Scroll-Funktionalität für Mobile Arrow
function scrollToStand() {
    const container = document.querySelector('.beach-container');
    const targetScroll = window.innerWidth * 0.8; // Scroll zum rechten Bereich

    // Smooth scroll animation
    const startScroll = container.scrollLeft;
    const distance = targetScroll - startScroll;
    const duration = 1000;
    const startTime = performance.now();

    function animateScroll(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function
        const easeInOutCubic = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        container.scrollLeft = startScroll + (distance * easeInOutCubic);

        if (progress < 1) {
            requestAnimationFrame(animateScroll);
        }
    }

    requestAnimationFrame(animateScroll);

    // Vibration feedback
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// Flaschenwerf-Animation
function showBottleThrowAnimation() {
    const modal = document.querySelector('.message-paper');
    modal.style.animation = 'none';
    modal.offsetHeight; // Force reflow
    modal.style.animation = 'bottleThrow 1.5s ease-in-out';
    createConfetti();
}

// Konfetti-Effekt
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

            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.remove();
                }
            }, 4000);
        }, i * 50);
    }
}

// Notification System
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    Object.assign(notification.style, {
        position: 'fixed',
        top: '80px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '10px',
        color: 'white',
        fontFamily: 'Courier New, monospace',
        fontWeight: 'bold',
        fontSize: '14px',
        zIndex: '5000',
        maxWidth: '300px',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
        animation: 'notificationSlide 0.3s ease-out'
    });

    // Farben je nach Typ
    switch (type) {
        case 'success':
            notification.style.background = 'linear-gradient(145deg, #32CD32, #228B22)';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(145deg, #FF8C00, #FF6347)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(145deg, #DC143C, #B22222)';
            break;
        default:
            notification.style.background = 'linear-gradient(145deg, #4682B4, #2F4F4F)';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'notificationSlideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 4000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    // Initial Gallery laden
    updateGallery();

    // Scroll-Events für Hide/Show von Arrow und Hint
    const container = document.querySelector('.beach-container');
    let scrollTimeout;

    container.addEventListener('scroll', function () {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const scrollHint = document.querySelector('.scroll-hint');
            const mobileArrow = document.querySelector('.mobile-arrow');

            if (container.scrollLeft > window.innerWidth * 0.4) {
                // Ausblenden wenn weit gescrollt
                if (scrollHint) {
                    scrollHint.style.opacity = '0';
                    setTimeout(() => scrollHint.style.display = 'none', 300);
                }
                if (mobileArrow) {
                    mobileArrow.style.opacity = '0';
                    setTimeout(() => mobileArrow.style.display = 'none', 300);
                }
            } else {
                // Wieder einblenden
                if (scrollHint && window.innerWidth > 768) {
                    scrollHint.style.display = 'block';
                    scrollHint.style.opacity = '1';
                }
                if (mobileArrow && window.innerWidth <= 768) {
                    mobileArrow.style.display = 'flex';
                    mobileArrow.style.opacity = '1';
                }
            }
        }, 100);
    });

    // Keyboard Navigation
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeMessageModal();
            closeGallery();
        } else if (event.key === 'Enter' && event.ctrlKey) {
            const messageModal = document.getElementById('messageModal');
            if (messageModal.style.display === 'flex') {
                sendMessage();
            }
        } else if (event.key === 'ArrowRight') {
            scrollToStand();
        }
    });

    // Modal schließen bei Klick außerhalb
    window.addEventListener('click', function (event) {
        const messageModal = document.getElementById('messageModal');
        const galleryModal = document.getElementById('galleryModal');

        if (event.target === messageModal) {
            closeMessageModal();
        }
        if (event.target === galleryModal) {
            closeGallery();
        }
    });
});

// CSS Animationen dynamisch hinzufügen
const style = document.createElement('style');
style.textContent = `
    @keyframes bottleThrow {
        0% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-50px) rotate(180deg); opacity: 0.5; }
        100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }
    
    @keyframes confettiFall {
        0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
    
    @keyframes notificationSlide {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes notificationSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes contentSlideUp {
        from { opacity: 1; max-height: 200px; }
        to { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; }
    }
`;
document.head.appendChild(style);