// Nachrichten-Speicher (in echtem Projekt würde das ein Backend sein)
let messages = [
    {
        author: "Max Mustermann",
        content: "Herzlichen Glückwunsch zu eurem besonderen Tag! Ihr seid ein wunderbares Paar und habt so viele schöne Jahre zusammen verbracht. Mögen noch viele weitere folgen!",
        timestamp: new Date(Date.now() - 86400000).toISOString() // 1 Tag alt
    },
    {
        author: "Anna Schmidt",
        content: "Liebe Oma, lieber Opa! Danke für all die tollen Erinnerungen und eure Weisheit. Ihr seid die besten Großeltern der Welt!",
        timestamp: new Date(Date.now() - 43200000).toISOString() // 12 Stunden alt
    },
    {
        author: "Familie Müller",
        content: "Was für ein besonderer Meilenstein! 100 Jahre gemeinsam - das ist wahre Liebe. Wir freuen uns darauf, mit euch zu feiern!",
        timestamp: new Date(Date.now() - 21600000).toISOString() // 6 Stunden alt
    }
];

// Scroll zur großen Flaschenpost mit smooth animation
function scrollToStand() {
    const container = document.querySelector('.beach-container');
    const targetScroll = window.innerWidth * 0.7; // Angepasst für 150vw statt 200vw

    // Smooth scroll animation
    const startScroll = container.scrollLeft;
    const distance = targetScroll - startScroll;
    const duration = 1000; // 1 Sekunde
    const startTime = performance.now();

    function animateScroll(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function für smooth animation
        const easeInOutCubic = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        container.scrollLeft = startScroll + (distance * easeInOutCubic);

        if (progress < 1) {
            requestAnimationFrame(animateScroll);
        }
    }

    requestAnimationFrame(animateScroll);

    // Vibration feedback für mobile Geräte
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// Message Modal öffnen/schließen
function openMessageModal() {
    const modal = document.getElementById('messageModal');
    modal.style.display = 'flex';

    // Focus auf Name-Input für bessere UX
    setTimeout(() => {
        document.getElementById('authorName').focus();
    }, 100);

    // Vibration feedback
    if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
    }

    // Scroll hint ausblenden wenn Modal offen ist
    document.querySelector('.scroll-hint').style.display = 'none';
}

function closeMessageModal() {
    const modal = document.getElementById('messageModal');
    modal.style.display = 'none';

    // Felder zurücksetzen
    document.getElementById('authorName').value = '';
    document.getElementById('messageText').value = '';

    // Scroll hint wieder einblenden
    document.querySelector('.scroll-hint').style.display = 'block';
}

// Nachricht senden mit verbesserter Validierung
function sendMessage() {
    const author = document.getElementById('authorName').value.trim();
    const content = document.getElementById('messageText').value.trim();

    // Validierung
    if (!author) {
        showNotification('Bitte gib deinen Namen ein!', 'warning');
        document.getElementById('authorName').focus();
        return;
    }

    if (author.length < 2) {
        showNotification('Der Name ist etwas kurz. Mindestens 2 Zeichen!', 'warning');
        document.getElementById('authorName').focus();
        return;
    }

    if (!content) {
        showNotification('Bitte schreibe eine Nachricht!', 'warning');
        document.getElementById('messageText').focus();
        return;
    }

    if (content.length < 1) {
        showNotification('Die Nachricht ist zu kurz. Mindestens 1 Zeichen!', 'warning');
        document.getElementById('messageText').focus();
        return;
    }

    // Profanity Filter (einfach)
    const forbiddenWords = ['blöd', 'doof', 'dumm', 'hass'];
    const contentLower = content.toLowerCase();
    const hasForbiddenWord = forbiddenWords.some(word => contentLower.includes(word));

    if (hasForbiddenWord) {
        showNotification('Bitte verwende freundliche Worte für diesen besonderen Tag!', 'warning');
        return;
    }

    // Neue Nachricht erstellen
    const newMessage = {
        author: author,
        content: content,
        timestamp: new Date().toISOString()
    };

    // Nachricht zu Array hinzufügen (neueste zuerst)
    messages.unshift(newMessage);

    // Erfolgs-Animation und Feedback
    showBottleThrowAnimation();

    // Modal schließen nach kurzer Verzögerung
    setTimeout(() => {
        closeMessageModal();
        showNotification('Deine Flaschenpost wurde ins Meer geworfen!', 'success');
        updateGallery();
    }, 1500);

    // In echtem Projekt: Nachricht an Backend senden
    // fetch('/api/messages', { method: 'POST', body: JSON.stringify(newMessage) });
}

// Flaschenwerf-Animation
function showBottleThrowAnimation() {
    const modal = document.querySelector('.message-paper');
    modal.style.animation = 'bottleThrow 1.5s ease-in-out';

    // Konfetti-Effect (vereinfacht)
    createConfetti();

    // Vibration
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 100]);
    }
}

// Einfacher Konfetti-Effekt
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

            // Konfetti nach Animation entfernen
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 4000);
        }, i * 50);
    }
}

// Notification System
function showNotification(message, type = 'info') {
    // Vorhandene Notification entfernen
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Styling
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

    // Auto-remove nach 4 Sekunden
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

// Gallery öffnen/schließen
function openGallery() {
    const modal = document.getElementById('galleryModal');
    modal.style.display = 'flex';
    updateGallery();

    // Scroll hint ausblenden
    document.querySelector('.scroll-hint').style.display = 'none';

    // Vibration feedback
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

function closeGallery() {
    const modal = document.getElementById('galleryModal');
    modal.style.display = 'none';

    // Scroll hint wieder einblenden wenn nicht bei der Flasche
    const container = document.querySelector('.beach-container');
    if (container.scrollLeft < window.innerWidth * 0.6) { // Angepasst für neue Breite
        document.querySelector('.scroll-hint').style.display = 'block';
    }
}

// Gallery aktualisieren mit verbesserter UI
function updateGallery() {
    const container = document.getElementById('messagesContainer');

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
        const messageDate = new Date(message.timestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now - messageDate) / (1000 * 60));

        let timeString;
        if (diffMinutes < 1) {
            timeString = 'Gerade eben';
        } else if (diffMinutes < 60) {
            timeString = `vor ${diffMinutes} Min.`;
        } else if (diffMinutes < 1440) {
            const hours = Math.floor(diffMinutes / 60);
            timeString = `vor ${hours} Std.`;
        } else {
            timeString = messageDate.toLocaleDateString('de-DE');
        }

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

        // Hover-Effekt für Touch-Geräte
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

// Nachrichten-Inhalt ein/ausblenden mit Animation
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

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    // Initial Gallery laden
    updateGallery();

    // Scroll hint ausblenden wenn zur Flasche gescrollt wird
    const container = document.querySelector('.beach-container');
    let scrollTimeout;

    container.addEventListener('scroll', function () {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const scrollHint = document.querySelector('.scroll-hint');
            if (container.scrollLeft > window.innerWidth * 0.4) { // Angepasst für neue Breite
                scrollHint.style.opacity = '0';
                setTimeout(() => {
                    scrollHint.style.display = 'none';
                }, 300);
            } else {
                scrollHint.style.display = 'block';
                scrollHint.style.opacity = '1';
            }
        }, 100);
    });

    // Keyboard Navigation
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeMessageModal();
            closeGallery();
        } else if (event.key === 'Enter' && event.ctrlKey) {
            // Strg+Enter zum Senden
            const messageModal = document.getElementById('messageModal');
            if (messageModal.style.display === 'flex') {
                sendMessage();
            }
        } else if (event.key === 'ArrowRight') {
            // Pfeil rechts zum Scrollen
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

    // Textarea Auto-Resize
    const textarea = document.getElementById('messageText');
    textarea.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });

    // Character counter für Textarea
    textarea.addEventListener('input', function () {
        const charCount = this.value.length;
        const maxChars = 500;

        let counter = document.querySelector('.char-counter');
        if (!counter) {
            counter = document.createElement('div');
            counter.className = 'char-counter';
            counter.style.cssText = 'text-align: right; font-size: 12px; color: #666; margin-top: 5px;';
            textarea.parentNode.insertBefore(counter, textarea.nextSibling);
        }

        counter.textContent = `${charCount}/${maxChars} Zeichen`;

        if (charCount > maxChars) {
            counter.style.color = '#DC143C';
            this.value = this.value.substring(0, maxChars);
        } else if (charCount > maxChars * 0.9) {
            counter.style.color = '#FF8C00';
        } else {
            counter.style.color = '#666';
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

// Service Worker für Offline-Funktionalität (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        // Hier könnte ein Service Worker registriert werden
        // navigator.serviceWorker.register('/sw.js');
    });
}