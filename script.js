// Referenzen auf DOM-Elemente
const messageModal = document.getElementById("messageModal");
const galleryModal = document.getElementById("galleryModal");
const authorInput = document.getElementById("authorName");
const messageTextarea = document.getElementById("messageText");
const messagesContainer = document.getElementById("messagesContainer");

//open message
function openMessageModal() {
    messageModal.style.display = "flex";
}

// close message
function closeMessageModal() {
    messageModal.style.display = "none";
    // Optional: Eingabefelder leeren
    authorInput.value = "";
    messageTextarea.value = "";
}

// open gallery
function openGallery() {
    galleryModal.style.display = "flex";
    renderMessages();
}

// close gallery
function closeGallery() {
    galleryModal.style.display = "none";
}

// save new message
function sendMessage() {
    const author = authorInput.value.trim();
    const text = messageTextarea.value.trim();

    if (text.length < 1) {
        alert("Bitte schreibe eine Nachricht.");
        return;
    }

    const newMessage = {
        author: author || "Anonym",
        text: text,
        timestamp: new Date().toISOString()
    };

    // get message
    const messages = JSON.parse(localStorage.getItem("flaschenpost")) || [];

    // new message
    messages.push(newMessage);

    // save in localStorage
    localStorage.setItem("flaschenpost", JSON.stringify(messages));

    // after sent, close modal
    closeMessageModal();
}

// show messages
function renderMessages() {
    messagesContainer.innerHTML = "";
    const messages = JSON.parse(localStorage.getItem("flaschenpost")) || [];

    if (messages.length === 0) {
        messagesContainer.innerHTML = "<p>Noch keine Flaschenpost vorhanden.</p>";
        return;
    }

    // latest messages on top
    messages.reverse().forEach(msg => {
        const entry = document.createElement("div");
        entry.className = "flask-entry";

        const authorEl = document.createElement("div");
        authorEl.className = "flask-author";
        authorEl.textContent = msg.author;

        const textEl = document.createElement("div");
        textEl.className = "flask-message";
        textEl.textContent = msg.text;

        entry.appendChild(authorEl);
        entry.appendChild(textEl);
        messagesContainer.appendChild(entry);
    });
}

// Optional: load messages before
document.addEventListener("DOMContentLoaded", () => {
    renderMessages();
});
