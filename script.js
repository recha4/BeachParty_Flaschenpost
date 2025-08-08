// Viewport Height fix für Mobile Browser
function setVH() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Zusätzliche Viewport-Reset Funktion
function resetViewport() {
    if (window.innerWidth <= 768) {
        // Scroll to top um Viewport zu resetten
        window.scrollTo(0, 0);

        // VH neu berechnen
        setTimeout(() => {
            setVH();
        }, 50);

        // Body Focus entfernen (hilft bei iOS)
        if (document.activeElement) {
            document.activeElement.blur();
        }
    }
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

    // Viewport nach Keyboard-Schließung zurücksetzen
    setTimeout(() => {
        // Viewport Height neu berechnen
        setVH();

        // Zusätzlicher Viewport-Reset für Mobile
        if (window.innerWidth <= 768) {
            if (document.activeElement) {
                document.activeElement.blur();
            }

            // Body kurz scrollen um Viewport zu "kicken"
            window.scrollTo(0, 0);

            // Viewport meta tag temporär ändern um Reset zu forcieren
            const viewport = document.querySelector('meta[name="viewport"]');
            const originalContent = viewport.content;
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

            setTimeout(() => {
                viewport.content = originalContent;
                setVH(); // VH nochmal neu setzen
                window.scrollTo(0, 0);
            }, 100);
        }
    }, 100);
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

window.addEventListener('resize', () => {
    setVH();
    resetViewport();
});

window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        setVH();
        resetViewport();
    }, 500); // Delay für Orientation Change
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