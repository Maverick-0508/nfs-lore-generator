// --- CONFIGURATION ---
const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY";
const ELEVENLABS_API_KEY = "sk_8626cba52bc5c6844177e52219bee5e5b4df3c25a59ac4c2"
const ELEVENLABS_VOICE_ID = "https://elevenlabs.io/app/agents/voice-library?voiceId=19STyYD15bswVz51nqLf; "

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
    // 1. Fetch Text from OpenAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `Write a dramatic, 60-word SCPD police dispatch log for a ${year} ${make} ${model} suspected of high-speed street racing in Seacrest County. Start with 'All units' or 'Dispatch to active units'. Use tactical racing game terminology.`
        }],
        temperature: 0.85
      })
    });

    const aiData = await aiResponse.json();
    const scriptText = aiData.choices[0].message.content;

    // Dynamically update text box on screen
    if (transcriptBox) transcriptBox.innerText = `"${scriptText}"`;

    // 2. Fetch Audio from ElevenLabs
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: scriptText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.75, similarity_boost: 0.85 }
      })
    });

    if (!ttsResponse.ok) throw new Error("Voice synthesis failed");

    // 3. Play the Audio
    const audioBlob = await ttsResponse.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();

  } catch (error) {
    console.error(error);
    alert("Communication error. Check console logs.");
  } finally {
    takedownBtn.innerText = "INITIATE TAKEDOWN";
    takedownBtn.disabled = false;
  }
});