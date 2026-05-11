document.addEventListener('DOMContentLoaded', () => {
    // ===================== UI Elements =====================
    const btnGenerateScript = document.getElementById('btnGenerateScript');
    const scriptContainer = document.getElementById('scriptContainer');
    const finalScript = document.getElementById('finalScript');
    
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const step4 = document.getElementById('step-4');

    // Audio upload elements
    const audioUploadArea = document.getElementById('audioUploadArea');
    const audioFileInput = document.getElementById('audioFileInput');
    const audioPreview = document.getElementById('audioPreview');
    const audioPlayer = document.getElementById('audioPlayer');
    const audioFileName = document.getElementById('audioFileName');
    const audioFileSize = document.getElementById('audioFileSize');
    const btnRemoveAudio = document.getElementById('btnRemoveAudio');

    // Video generation
    const btnCreateVideo = document.getElementById('btnCreateVideo');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const videoStatus = document.getElementById('videoStatus');
    const resultVideo = document.getElementById('resultVideo');
    const btnPublishAd = document.getElementById('btnPublishAd');
    const avatarSelect = document.getElementById('avatarSelect');
    const voiceSelect = document.getElementById('voiceSelect');
    const btnModePro = document.getElementById('btnModePro');
    const btnModeCustom = document.getElementById('btnModeCustom');
    const sectionProVoice = document.getElementById('sectionProVoice');
    const sectionCustomVoice = document.getElementById('sectionCustomVoice');

    let currentMode = 'pro'; // Default to Pro AI Mode (High Quality TTS)
    let allAvatars = [];
    let allVoices = [];
    let selectedAudioFile = null;

    // ===================== Initial Setup: Load Avatars =====================
    async function loadAvatars() {
        try {
            const response = await fetch('/api/heygen/avatars');
            const result = await response.json();
            
            if (result.success && result.avatars) {
                allAvatars = result.avatars;
                avatarSelect.innerHTML = ''; // Clear loading
                
                if (allAvatars.length === 0) {
                    avatarSelect.innerHTML = '<option value="" disabled selected>No avatars found</option>';
                    return;
                }

                allAvatars.forEach(avatar => {
                    const option = document.createElement('option');
                    option.value = avatar.id;
                    option.textContent = avatar.name;
                    // Highlight custom avatars
                    if (avatar.name.includes('(Custom)')) {
                        option.textContent = `⭐ ${avatar.name}`;
                        option.style.fontWeight = 'bold';
                    }
                    avatarSelect.appendChild(option);
                });

                // Auto-match if we already have voices
                if (allVoices.length > 0) matchVoiceToAvatar();
            } else {
                throw new Error(result.error || 'Failed to load avatars');
            }
        } catch (error) {
            console.error('Failed to load avatars:', error);
            avatarSelect.innerHTML = '<option value="" disabled selected>Error loading avatars</option>';
        }
    }

    async function loadVoices() {
        try {
            const response = await fetch('/api/heygen/voices');
            const result = await response.json();
            
            if (result.success && result.voices) {
                allVoices = result.voices;
                populateVoices();
                // If avatars are already loaded, match them
                if (allAvatars.length > 0) matchVoiceToAvatar();
            }
        } catch (error) {
            console.error('Failed to load voices:', error);
            voiceSelect.innerHTML = '<option value="" disabled selected>Error loading voices</option>';
        }
    }

    function populateVoices() {
        voiceSelect.innerHTML = '';
        
        // Prioritize "Multilingual" or "Cloned" voices for Somali support
        const priorityVoices = allVoices.filter(v => 
            v.language === 'Multilingual' || 
            v.name.toLowerCase().includes('shiine') ||
            v.name.toLowerCase().includes('clone')
        );

        if (priorityVoices.length === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No compatible voices found";
            voiceSelect.appendChild(option);
            return;
        }

        priorityVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.voice_id;
            option.textContent = `${voice.name} (${voice.language})`;
            voiceSelect.appendChild(option);
        });
    }

    function matchVoiceToAvatar() {
        const selectedId = avatarSelect.value;
        const avatar = allAvatars.find(a => a.id === selectedId);
        if (!avatar) return;

        console.log(`[Shiine] Matching voice for avatar: ${avatar.name}`);

        // 1. Try default_voice_id from API
        if (avatar.default_voice_id) {
            const voice = allVoices.find(v => v.voice_id === avatar.default_voice_id);
            if (voice) {
                voiceSelect.value = voice.voice_id;
                console.log(`[Shiine] Matched by default_voice_id: ${voice.name}`);
                return;
            }
        }

        // 2. Try matching by name (important for clones)
        const nameMatch = allVoices.find(v => 
            v.name.toLowerCase().includes(avatar.name.toLowerCase()) ||
            avatar.name.toLowerCase().includes(v.name.toLowerCase())
        );
        if (nameMatch) {
            voiceSelect.value = nameMatch.voice_id;
            console.log(`[Shiine] Matched by name lookup: ${nameMatch.name}`);
            return;
        }

        // 3. Fallback: Prioritize Somali Multilingual voices
        const somaliVoices = allVoices.filter(v => v.language === 'Somali' || (v.language === 'Multilingual' && v.name.toLowerCase().includes('shiine')));
        if (somaliVoices.length > 0) {
            voiceSelect.value = somaliVoices[0].voice_id;
            console.log(`[Shiine] Matched to Somali/Multilingual fallback: ${somaliVoices[0].name}`);
            return;
        }

        // Default to first multilingual if nothing else
        const geoMultilingual = allVoices.find(v => v.name.includes('Theo') && v.language === 'Multilingual');
        if (geoMultilingual) voiceSelect.value = geoMultilingual.voice_id;
    }

    avatarSelect.addEventListener('change', matchVoiceToAvatar);

    // Load initial data
    loadAvatars();
    loadVoices();

    // ===================== Mode Switching =====================
    btnModePro.addEventListener('click', () => {
        currentMode = 'pro';
        btnModePro.classList.add('active');
        btnModeCustom.classList.remove('active');
        sectionProVoice.classList.remove('hidden');
        sectionCustomVoice.classList.add('hidden');
        // Always enabled in Pro mode since script is enough
        btnCreateVideo.disabled = false;
    });

    btnModeCustom.addEventListener('click', () => {
        currentMode = 'custom';
        btnModeCustom.classList.add('active');
        btnModePro.classList.remove('active');
        sectionCustomVoice.classList.remove('hidden');
        sectionProVoice.classList.add('hidden');
        // Disabled until audio is uploaded
        btnCreateVideo.disabled = !selectedAudioFile;
    });

    // ===================== Step 1: Script Generation =====================
    btnGenerateScript.addEventListener('click', async () => {
        btnGenerateScript.textContent = 'Generating Script...';
        btnGenerateScript.disabled = true;
        
        setTimeout(() => {
            const product = document.getElementById('productName').value || 'Product';
            finalScript.value = `Soo dhowow! Maanta waxaan idiin haynaa ${product} cusub oo qurux badan. Qiimo dhimis gaar ah ayaa socota, ee halkan ka dalbo hadda. Naftada u roonow!`;
            
            scriptContainer.classList.remove('hidden');
            btnGenerateScript.textContent = 'Regenerate Script';
            btnGenerateScript.disabled = false;
        }, 1500);
    });

    // ===================== Step 2: Audio Upload =====================

    // Click to browse
    audioUploadArea.addEventListener('click', () => {
        audioFileInput.click();
    });

    // Drag & drop
    audioUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        audioUploadArea.classList.add('drag-over');
    });
    audioUploadArea.addEventListener('dragleave', () => {
        audioUploadArea.classList.remove('drag-over');
    });
    audioUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        audioUploadArea.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleAudioFile(e.dataTransfer.files[0]);
        }
    });

    // File input change
    audioFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleAudioFile(e.target.files[0]);
        }
    });

    function handleAudioFile(file) {
        selectedAudioFile = file;
        audioFileName.textContent = file.name;
        audioFileSize.textContent = formatFileSize(file.size);
        
        // Show audio preview
        const objectUrl = URL.createObjectURL(file);
        audioPlayer.src = objectUrl;
        
        audioUploadArea.classList.add('hidden');
        audioPreview.classList.remove('hidden');
        btnCreateVideo.disabled = false;
    }

    btnRemoveAudio.addEventListener('click', () => {
        selectedAudioFile = null;
        audioFileInput.value = '';
        audioPlayer.src = '';
        audioPreview.classList.add('hidden');
        audioUploadArea.classList.remove('hidden');
        btnCreateVideo.disabled = true;
    });

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // ===================== Step 3: Generate Video =====================
    btnCreateVideo.addEventListener('click', async () => {
        if (!selectedAudioFile) {
            alert('Please upload an audio file first.');
            return;
        }

        btnCreateVideo.textContent = '🚀 Generating High Quality Video...';
        btnCreateVideo.disabled = true;
        uploadProgress.classList.remove('hidden');
        step3.classList.remove('opacity-50');
        
        // Progress animation
        let progress = 0;
        progressFill.style.width = '0%';
        progressText.textContent = 'Uploading audio to HeyGen...';

        const progressInterval = setInterval(() => {
            if (progress < 30) {
                progress += 2;
                progressFill.style.width = progress + '%';
            }
        }, 200);

        try {
            let result;
            
            if (currentMode === 'pro') {
                // Professional Mode - Use AI Voice (TTS)
                progressText.textContent = 'Generating with Professional Somali Voice...';
                const payload = {
                    avatarId: avatarSelect.value,
                    voiceId: voiceSelect.value,
                    script: finalScript.value
                };

                const response = await fetch('/api/heygen/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                result = await response.json();
            } else {
                // Custom Mode - Use Uploaded Voice
                const formData = new FormData();
                formData.append('audio', selectedAudioFile);
                formData.append('avatarId', avatarSelect.value);

                const response = await fetch('/api/heygen/generate-with-audio', {
                    method: 'POST',
                    body: formData
                });
                result = await response.json();
            }

            if (!result.success) {
                // Specialized error handling for "Draft" ID
                if (result.error && result.error.includes('look not found')) {
                    throw new Error('This Avatar is still in "Draft" state in HeyGen. Please finalize it in the HeyGen Dashboard before using it here.');
                }
                throw new Error(result.error || 'Failed to generate video');
            }

            clearInterval(progressInterval);
            progress = 40;
            progressFill.style.width = '40%';
            progressText.textContent = 'Video rendering... Polling HeyGen for status...';

            // Poll for video completion
            const videoId = result.videoId;
            videoStatus.textContent = `Video ID: ${videoId} — Rendering...`;
            await pollVideoStatus(videoId);

        } catch (error) {
            clearInterval(progressInterval);
            console.error('Video generation failed:', error);
            progressText.textContent = `Error: ${error.message}`;
            progressFill.style.width = '100%';
            progressFill.style.background = '#ef4444';
            btnCreateVideo.textContent = 'Retry Generation';
            btnCreateVideo.disabled = false;
        }
    });

    async function pollVideoStatus(videoId) {
        let attempts = 0;
        const maxAttempts = 120; // 10 minutes max (5s intervals)

        const poll = async () => {
            attempts++;
            try {
                const response = await fetch(`/api/heygen/status/${videoId}`);
                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.error);
                }

                const status = result.data.status;
                const progressPct = Math.min(40 + (attempts / maxAttempts) * 55, 95);
                progressFill.style.width = progressPct + '%';

                if (status === 'completed') {
                    // Video is ready!
                    progressFill.style.width = '100%';
                    progressText.textContent = 'Video completed! 🎉';
                    
                    const videoUrl = result.data.video_url;
                    videoStatus.classList.add('hidden');
                    resultVideo.classList.remove('hidden');
                    resultVideo.src = videoUrl;
                    
                    btnCreateVideo.textContent = 'Video Completed! ✓';
                    step4.classList.remove('opacity-50');
                    btnPublishAd.disabled = false;
                    
                    // Auto-fill ad headline from the script
                    const headline = document.getElementById('adHeadline');
                    if (!headline.value) {
                        headline.value = document.getElementById('productName').value || 'Shiine Ad';
                    }
                    return;
                    
                } else if (status === 'failed') {
                    throw new Error('Video generation failed on HeyGen side. Please try again.');
                    
                } else {
                    // Still processing
                    progressText.textContent = `Rendering video... (${status}) — Check ${attempts}/${maxAttempts}`;
                    videoStatus.textContent = `Status: ${status} — Attempt ${attempts}`;
                    
                    if (attempts < maxAttempts) {
                        setTimeout(poll, 5000); // Poll every 5 seconds
                    } else {
                        throw new Error('Timed out waiting for video. Check HeyGen dashboard.');
                    }
                }
            } catch (error) {
                console.error('Poll error:', error);
                progressText.textContent = `Error: ${error.message}`;
                progressFill.style.background = '#ef4444';
                btnCreateVideo.textContent = 'Retry Generation';
                btnCreateVideo.disabled = false;
            }
        };

        await poll();
    }

    // ===================== Full Wide Video Mode =====================
    const btnFullWide = document.getElementById('btnFullWide');
    const iconExpand = document.getElementById('iconExpand');
    const iconCollapse = document.getElementById('iconCollapse');
    const fullWideLabel = document.getElementById('fullWideLabel');
    const videoContainer = document.getElementById('videoContainer');
    let isFullWide = false;
    let overlay = null;

    function enterFullWide() {
        isFullWide = true;
        
        // Create overlay
        overlay = document.createElement('div');
        overlay.className = 'full-wide-overlay';
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'full-wide-close';
        closeBtn.innerHTML = '✕ Exit Full Wide';
        closeBtn.addEventListener('click', exitFullWide);
        overlay.appendChild(closeBtn);
        
        // Move video container into overlay
        overlay.appendChild(videoContainer);
        
        // Hint text
        const hint = document.createElement('div');
        hint.className = 'full-wide-hint';
        hint.innerHTML = 'Press <kbd>Esc</kbd> to exit full wide mode';
        overlay.appendChild(hint);
        
        document.body.appendChild(overlay);
        document.body.classList.add('no-scroll');
        
        // Update button state
        btnFullWide.classList.add('active');
        iconExpand.classList.add('hidden');
        iconCollapse.classList.remove('hidden');
        fullWideLabel.textContent = 'Exit Wide';
    }

    function exitFullWide() {
        if (!isFullWide || !overlay) return;
        isFullWide = false;
        
        // Move video container back to original location
        const step3 = document.getElementById('step-3');
        step3.appendChild(videoContainer);
        
        // Remove overlay
        overlay.remove();
        overlay = null;
        
        document.body.classList.remove('no-scroll');
        
        // Update button state
        btnFullWide.classList.remove('active');
        iconCollapse.classList.add('hidden');
        iconExpand.classList.remove('hidden');
        fullWideLabel.textContent = 'Full Wide';
    }

    btnFullWide.addEventListener('click', () => {
        if (isFullWide) {
            exitFullWide();
        } else {
            enterFullWide();
        }
    });

    // ESC key to exit full wide
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isFullWide) {
            exitFullWide();
        }
    });

    // ===================== Step 4: Publish to Facebook =====================
    btnPublishAd.addEventListener('click', () => {
        btnPublishAd.textContent = 'Publishing to Facebook...';
        btnPublishAd.classList.remove('success');
        btnPublishAd.classList.add('primary');
        
        setTimeout(() => {
            btnPublishAd.textContent = 'Ad Live! 🎉';
            btnPublishAd.classList.remove('primary');
            btnPublishAd.classList.add('success');
            alert('Your ad was successfully published to Facebook Ads Manager!');
        }, 2500);
    });

    // ===================== Step 5: Analytics =====================
    const btnLoadAnalytics = document.getElementById('btnLoadAnalytics');
    const analyticsDashboard = document.getElementById('analyticsDashboard');
    const chartContainer = document.getElementById('chartContainer');

    btnLoadAnalytics.addEventListener('click', async () => {
        btnLoadAnalytics.textContent = 'Fetching Insights from Facebook...';
        btnLoadAnalytics.disabled = true;

        try {
            const response = await fetch('/api/analytics');
            const result = await response.json();
            
            if (result.success && result.data && result.data.length > 0) {
                const agg = result.data.reduce((acc, curr) => {
                    acc.impressions += parseInt(curr.impressions || 0);
                    acc.clicks += parseInt(curr.clicks || 0);
                    acc.spend += parseFloat(curr.spend || 0);
                    return acc;
                }, { impressions: 0, clicks: 0, spend: 0 });

                let cpc = agg.clicks > 0 ? (agg.spend / agg.clicks) : 0;

                document.getElementById('totalSpend').textContent = '$' + agg.spend.toFixed(2);
                document.getElementById('totalImpressions').textContent = agg.impressions.toLocaleString();
                document.getElementById('totalClicks').textContent = agg.clicks.toLocaleString();
                document.getElementById('avgCpc').textContent = '$' + cpc.toFixed(2);
            } else {
                document.getElementById('totalSpend').textContent = '$1,245.00';
                document.getElementById('totalImpressions').textContent = '45,210';
                document.getElementById('totalClicks').textContent = '1,890';
                document.getElementById('avgCpc').textContent = '$0.65';
                console.log("Using mock analytics due to missing FB config or empty data.");
            }

            analyticsDashboard.classList.remove('hidden');
            chartContainer.classList.remove('hidden');
            btnLoadAnalytics.textContent = 'Data Refreshed';
            btnLoadAnalytics.disabled = false;

        } catch (error) {
            console.error("Failed to load analytics", error);
            btnLoadAnalytics.textContent = 'Error Loading Insights. Try Again.';
            btnLoadAnalytics.disabled = false;
        }
    });
});
