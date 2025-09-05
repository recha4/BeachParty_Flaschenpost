// Viewport Height fix für Mobile Browser
function setVH() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Supabase Konfiguration
const supabaseUrl = 'https://peamqqtnyxcenycwjvrn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYW1xcXRueXhjZW55Y3dqdnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NjE5NzEsImV4cCI6MjA3MDIzNzk3MX0.w428iHM28kJuX_Hu6GkIZEPl76-iXlTHI0_Nfjw-6wc';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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
                <p>Noch keine Flaschenpost gefunden...</p>
                <p style="font-size: 12px; margin-top: 10px;">Sei die erste, die eine Nachricht hinterlässt!</p>
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
    const modal = document.getElementById('messageModal');
    modal.style.display = 'flex';

    // Animation zurücksetzen beim Öffnen
    const messagesPaper = document.querySelector('.message-paper');
    messagesPaper.style.animation = 'none';
    messagesPaper.style.opacity = '1';
    messagesPaper.style.transform = 'translateY(0) scale(1) rotate(0deg)';

    // Focus auf Name-Input
    setTimeout(() => {
        document.getElementById('authorName').focus();
    }, 100);

    // Vibration feedback
    if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
    }

    // Hide scroll hint and mobile arrow
    const scrollHint = document.querySelector('.scroll-hint');
    const mobileArrow = document.querySelector('.mobile-arrow');
    if (scrollHint) scrollHint.style.display = 'none';
    if (mobileArrow) mobileArrow.style.display = 'none';
}

function closeMessageModal() {
    const modal = document.getElementById('messageModal');
    modal.style.display = 'none';

    // Animation komplett zurücksetzen beim Schliessen
    const messagesPaper = document.querySelector('.message-paper');
    messagesPaper.style.animation = 'paperSlideIn 0.4s ease'; // Zurück zur Standard-Animation
    messagesPaper.style.opacity = '1';
    messagesPaper.style.transform = 'translateY(0) scale(1) rotate(0deg)';

    // Felder zurücksetzen
    document.getElementById('authorName').value = '';
    document.getElementById('messageText').value = '';
}

function openGallery() {
    const modal = document.getElementById('galleryModal');
    modal.style.display = 'flex';
    updateGallery();

    // Hide scroll hint and mobile arrow
    const scrollHint = document.querySelector('.scroll-hint');
    const mobileArrow = document.querySelector('.mobile-arrow');
    if (scrollHint) scrollHint.style.display = 'none';
    if (mobileArrow) mobileArrow.style.display = 'none';

    // Vibration feedback
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

function closeGallery() {
    const modal = document.getElementById('galleryModal');
    modal.style.display = 'none';
}

// Flaschenwerf-Animation
function showBottleThrowAnimation() {
    const modal = document.querySelector('.message-paper');
    modal.style.animation = 'none';
    modal.offsetHeight; // Force reflow
    modal.style.animation = 'bottleThrow 1.5s ease-in-out';
    createConfetti();

    // Vibration
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 100]);
    }
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
                    confetti.parentNode.removeChild(confetti);
                }
            }, 4000);
        }, i * 50);
    }
}

// Notification System
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

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
    // Viewport Height für Mobile setzen
    setVH();

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

            // Responsive Scroll-Threshold
            let scrollThreshold;
            if (window.innerWidth <= 480) {
                scrollThreshold = window.innerWidth * 0.8; // Für 210vw Container
            } else {
                scrollThreshold = window.innerWidth * 0.4; // Normale Container
            }

            if (container.scrollLeft > scrollThreshold) {
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

        // PWA-Features initialisieren
        initPWAFeatures();
        handleURLActions();
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

    // Modal schliessen bei Klick ausserhalb
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

    // Netzwerk-Status überwachen
    window.addEventListener('online', () => {
        showNotification('Verbindung wiederhergestellt! 🌊', 'success');
        // Nachrichten neu laden wenn wieder online
        updateGallery();
    });

    window.addEventListener('offline', () => {
        showNotification('Offline-Modus aktiv', 'info');
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

// Viewport Height bei Resize/Orientation Change aktualisieren
window.addEventListener('resize', setVH);
window.addEventListener('orientationchange', setVH);

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
    
    @keyframes contentSlideDown {
        from { opacity: 0; max-height: 0; padding: 0 15px; }
        to { opacity: 1; max-height: 200px; padding: 15px; }
    }
    
    @keyframes contentSlideUp {
        from { opacity: 1; max-height: 200px; }
        to { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; }
    }
`;
document.head.appendChild(style);

// PWA Installation
let deferredPrompt;
let installButton = null;

// Service Worker registrieren
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/BeachParty_Flaschenpost/sw.js');
            console.log('SW registered: ', registration);
        } catch (registrationError) {
            console.log('SW registration failed: ', registrationError);
        }
    });
}

// PWA Installation Event abfangen
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('ok', 'beforeinstallprompt', e);
    // Verhindere automatische Installation
    e.preventDefault();
    // Speichere das Event für später
    deferredPrompt = e;
    // Zeige Install-Button
    showInstallButton();
});

// Install-Button erstellen und anzeigen
function showInstallButton() {
    // Erstelle Install-Button falls noch nicht vorhanden
    if (!installButton) {
        installButton = document.createElement('button');
        installButton.className = 'install-btn';
        installButton.innerHTML = 'App installieren';
        installButton.onclick = installPWA;

        // Füge Button zur UI hinzu
        const uiOverlay = document.querySelector('.ui-overlay');
        uiOverlay.appendChild(installButton);
    }

    installButton.style.display = 'block';
}

// PWA Installation auslösen
async function installPWA() {
    if (deferredPrompt) {
        // Zeige Install-Prompt
        deferredPrompt.prompt();

        // Warte auf Antwort des Users
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // Reset deferred prompt
        deferredPrompt = null;

        // Verstecke Install-Button
        if (installButton) {
            installButton.style.display = 'none';
        }

        // Zeige Bestätigung
        if (outcome === 'accepted') {
            showNotification('App wurde installiert!', 'success');
        }
    }
}

// Check wenn App bereits installiert ist
window.addEventListener('appinstalled', (evt) => {
    console.log('ok', 'appinstalled', evt);
    // Verstecke Install-Button
    if (installButton) {
        installButton.style.display = 'none';
    }
    showNotification('Beach Party App installiert!', 'success');
});

// URL Parameter für Shortcuts verarbeiten
function handleURLActions() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');

    switch (action) {
        case 'write':
            // Öffne sofort das Schreib-Modal
            setTimeout(() => openMessageModal(), 500);
            break;
        case 'gallery':
            // Öffne sofort die Galerie
            setTimeout(() => openGallery(), 500);
            break;
    }
}

// PWA Stand-alone Modus erkennen
function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
}

// PWA-spezifische Funktionen
function initPWAFeatures() {
    if (isPWA()) {
        console.log('App läuft im PWA-Modus!');

        // Zusätzliche PWA-Features
        document.body.classList.add('pwa-mode');

        // Verhindere Pull-to-Refresh in der PWA
        document.body.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        // Status-Bar Style für iOS
        if (navigator.userAgent.match(/iPhone|iPad|iPod/)) {
            const viewport = document.querySelector('meta[name=viewport]');
            viewport.setAttribute('content',
                viewport.getAttribute('content') + ', viewport-fit=cover'
            );
        }
    }
}

// Share API für moderne Browser
async function shareMessage(message) {
    if (navigator.share && navigator.canShare) {
        try {
            await navigator.share({
                title: 'Beach Party Flaschenpost',
                text: `Nachricht von ${message.author}: "${message.content}"`,
                url: window.location.href
            });
        } catch (error) {
            console.log('Share failed:', error);
        }
    } else {
        // Fallback: Copy to Clipboard
        const textToCopy = `Nachricht von ${message.author}: "${message.content}" - ${window.location.href}`;
        await navigator.clipboard.writeText(textToCopy);
        showNotification('In Zwischenablage kopiert!', 'success');
    }
}