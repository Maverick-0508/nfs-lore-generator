// --- CONFIGURATION ---
// Keys are safely moved to the server side system configuration mappings.
const SERVER_URL = "http://localhost:3000/api/generate-dispatch";

// --- UI ELEMENT TARGETING ---
const manufacturerInput = document.querySelector('input[placeholder="LAMBORGHINI"]') || document.querySelector('input');
const modelInput = document.getElementById('unit-model') || document.querySelectorAll('input')[1];
const yearInput = document.getElementById('fleet-year') || document.querySelectorAll('input')[2];
const takedownBtn = document.querySelector('button') || document.getElementById('initiate-takedown');
const transcriptBox = document.querySelector('.font-serif') || document.querySelector('blockquote');

// --- EVENT LISTENER ---
takedownBtn.addEventListener('click', async () => {
    const make = manufacturerInput.value || "Unknown Vehicle";
    const model = modelInput ? modelInput.value : "";
    const year = yearInput ? yearInput.value : "";

    takedownBtn.innerText = "PROCESSING TRANSMISSION...";
    takedownBtn.disabled = true;

    try {
        // 1. Fetch Text and Audio from local backend
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ make, model, year })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Server error");
        }

        const data = await response.json();
        const scriptText = data.script;

        // Dynamically update text box on screen
        if (transcriptBox) transcriptBox.innerText = `"${scriptText}"`;

        // Play the Audio
        const audio = new Audio(data.audio);
        audio.play();

    } catch (error) {
        console.error(error);
        alert("Communication error. Check console logs.");
    } finally {
        takedownBtn.innerText = "INITIATE TAKEDOWN";
        takedownBtn.disabled = false;
    }
});