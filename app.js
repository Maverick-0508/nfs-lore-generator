// --- CONFIGURATION ---
const SERVER_URL = "http://localhost:3000/api/generate-dispatch";

// --- UI ELEMENT TARGETING ---
const manufacturerInput = document.querySelectorAll('input')[0];
const modelInput = document.querySelectorAll('input')[1];
const yearInput = document.querySelectorAll('input')[2];
const transcriptBox = document.querySelector('blockquote');
const deployForm = document.getElementById('deployment-form');
const deployBtn = document.getElementById('main-deploy-btn');

// --- EVENT LISTENER ---
if (deployForm) {
    deployForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const make = manufacturerInput ? manufacturerInput.value : "Unknown Vehicle";
        const model = modelInput ? modelInput.value : "";
        const year = yearInput ? yearInput.value : "";

        // UI Loading State
        deployBtn.classList.add('btn-loading');
        const spanEl = deployBtn.querySelector('span');
        const originalText = spanEl ? spanEl.innerText : 'Initialize Deployment';
        if (spanEl) spanEl.innerText = 'SYNCHRONIZING...';

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

            // UI Success State
            if (spanEl) spanEl.innerHTML = '<span class="busted-glow">ASSET DEPLOYED</span>';
            deployBtn.classList.remove('btn-loading');
            deployBtn.style.borderColor = '#ff5252';
            deployBtn.style.color = '#ff5252';

        } catch (error) {
            console.error(error);
            alert("Communication error. Check console logs: " + error.message);
            if (spanEl) spanEl.innerText = 'ERROR';
            deployBtn.classList.remove('btn-loading');
        } finally {
            // Reset after 3 seconds
            setTimeout(() => {
                if (spanEl) spanEl.innerText = originalText;
                deployBtn.style.borderColor = '';
                deployBtn.style.color = '';
                deployBtn.classList.remove('btn-loading');
            }, 3000);
        }
    });
}