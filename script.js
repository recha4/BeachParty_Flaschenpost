// DEBUGGING SCHRITTE - Füge diese zu deinem script.js hinzu:

// 1. Erst mal testen ob der Arrow überhaupt existiert
console.log('Debug: Suche nach mobile arrow...');
const mobileArrow = document.querySelector('.mobile-arrow');
console.log('Mobile Arrow gefunden:', mobileArrow);

// 2. Einfache Test-Funktion erstellen
function testClick() {
    console.log('Mobile Arrow wurde geklickt!');
    alert('Arrow funktioniert!'); // Temporär zum Testen
}

// 3. Scroll-Funktion mit mehr Debugging
function scrollToRight() {
    console.log('scrollToRight() aufgerufen');

    const container = document.querySelector('.beach-container');
    console.log('Container gefunden:', container);

    if (!container) {
        console.error('Beach container nicht gefunden!');
        return;
    }

    const currentScroll = container.scrollLeft;
    const scrollAmount = window.innerWidth * 0.8;

    console.log('Aktueller Scroll:', currentScroll);
    console.log('Scroll Amount:', scrollAmount);

    container.scrollTo({
        left: currentScroll + scrollAmount,
        behavior: 'smooth'
    });

    console.log('Scroll ausgeführt zu:', currentScroll + scrollAmount);

    // Vibration feedback
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// 4. DOMContentLoaded Event mit Debugging
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM geladen, suche mobile arrow...');

    const mobileArrow = document.querySelector('.mobile-arrow');
    console.log('Mobile Arrow:', mobileArrow);

    if (mobileArrow) {
        console.log('Arrow gefunden! Füge Events hinzu...');

        // Erst mal nur Test-Click
        mobileArrow.addEventListener('click', function (e) {
            console.log('Click Event ausgelöst!', e);
            testClick();
        });

        mobileArrow.addEventListener('touchstart', function (e) {
            console.log('Touch Start Event ausgelöst!', e);
        });

        mobileArrow.addEventListener('touchend', function (e) {
            console.log('Touch End Event ausgelöst!', e);
            e.preventDefault();
            testClick();
        });

        // Prüfe CSS Properties
        const styles = window.getComputedStyle(mobileArrow);
        console.log('Arrow Display:', styles.display);
        console.log('Arrow Pointer Events:', styles.pointerEvents);
        console.log('Arrow Z-Index:', styles.zIndex);

    } else {
        console.error('Mobile Arrow nicht gefunden! Prüfe:');
        console.log('- Ist die CSS Klasse .mobile-arrow vorhanden?');
        console.log('- Ist das Element im HTML?');
        console.log('- Ist es durch CSS versteckt?');
    }
});

// 5. Prüfe auch ob das Element zur richtigen Zeit sichtbar ist
setTimeout(() => {
    console.log('--- 2 Sekunden später ---');
    const arrow = document.querySelector('.mobile-arrow');
    if (arrow) {
        const rect = arrow.getBoundingClientRect();
        console.log('Arrow Position:', rect);
        console.log('Arrow sichtbar:', rect.width > 0 && rect.height > 0);
    }
}, 2000);