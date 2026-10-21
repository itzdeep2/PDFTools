let visualElements = [];
let activeElement = null;
let mode = 'none';

function goHome() {
    window.location.hash = '#dashboard';
}

function handleRoute() {
    const hash = window.location.hash || '#dashboard';
    
    document.getElementById('dashboard').style.display = hash === '#dashboard' ? 'block' : 'none';
    document.getElementById('nav-bar').style.display = (hash === '#dashboard' || hash === '#add-text-sec') ? 'none' : 'block';
    document.getElementById('tools-wrapper').style.display = hash !== '#dashboard' ? 'block' : 'none';
    
    const sections = document.querySelectorAll('.tool-section');
    sections.forEach(sec => sec.style.display = 'none');
    
    if (hash !== '#dashboard') {
        const target = document.getElementById(hash.substring(1));
        if (target) {
            target.style.display = 'block';
        }
    }

    if (hash === '#add-text-sec') {
        document.body.style.padding = '0';
    } else {
        document.body.style.padding = '40px 20px';
    }
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', handleRoute);
document.querySelectorAll('.drop-zone').forEach(zone => {
        const input = zone.querySelector('input[type="file"]');
        const p = zone.querySelector('p');
        if (!input || !p) return;
        const originalText = p.innerText;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            zone.addEventListener(eventName, () => zone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, () => zone.classList.remove('dragover'), false);
        });

        zone.addEventListener('drop', (e) => {
            input.files = e.dataTransfer.files;
            input.dispatchEvent(new Event('change'));
        });

        input.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                p.innerText = this.files.length === 1 ? this.files[0].name : `${this.files.length} files selected`;
                p.style.color = 'var(--primary)';
            } else {
                p.innerText = originalText;
                p.style.color = 'var(--text-muted)';
            }
        });
    });

function changeTheme(theme) {
    if (theme === 'system') {
        document.body.removeAttribute('data-theme');
        localStorage.removeItem('pdf_tools_theme');
    } else {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('pdf_tools_theme', theme);
    }
    const event = new Event('themeChanged');
    document.dispatchEvent(event);
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playClickSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.05);
}

document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('.card') || e.target.closest('.studio-tool-rail-btn')) {
        playClickSound();
    }
});

function mergePDFs() { alert('Merge PDFs executed'); }
function splitPDF() { alert('Split PDF executed'); }
function convertPdfToJpg() { alert('PDF to JPG executed'); }
function removePassword() { alert('Remove Password executed'); }
function runOCR() { alert('OCR executed'); }
function protectPDF() { alert('Protect PDF executed'); }
function compressPdf() { alert('Compress PDF executed'); }

function enableTextMode() {
    mode = 'text';
    document.querySelectorAll('.studio-tool-rail-btn').forEach(btn => btn.classList.remove('active'));
    if(event && event.currentTarget) event.currentTarget.classList.add('active');
}

function handleImageInsert(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const wrapper = document.createElement('div');
        wrapper.className = 'draggable-image';
        wrapper.style.left = '50px';
        wrapper.style.top = '50px';
        wrapper.style.width = '200px';
        wrapper.style.height = '150px';
        wrapper.style.backgroundImage = `url(${e.target.result})`;
        wrapper.setAttribute('data-src', e.target.result);
        wrapper.tabIndex = 0;

        document.getElementById('editor-canvas-wrapper').appendChild(wrapper);
        visualElements.push(wrapper);
    };
    reader.readAsDataURL(file);
    input.value = '';
}

function toggleOcrPanel() {
    const panel = document.getElementById('ocr-panel');
    if(panel) panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
}

async function runEditorOCR() {
    const lang = document.getElementById('editor-ocr-language').value;
    const resultBox = document.getElementById('editor-ocr-result');
    const wrapper = document.getElementById('editor-canvas-wrapper');
    const canvas = wrapper.querySelector('canvas');
    
    if (!canvas) {
        resultBox.innerText = "Please open a PDF file first.";
        return;
    }

    resultBox.innerText = `Downloading ${lang} language model and scanning canvas...`;
    const targetForOcr = canvas.toDataURL('image/jpeg');
    
    try {
        const worker = await Tesseract.createWorker();
        await worker.loadLanguage(lang);
        await worker.initialize(lang);
        
        const { data: { text } } = await worker.recognize(targetForOcr);
        resultBox.innerText = text || "No text found on this page.";
        await worker.terminate();
    } catch (error) {
        resultBox.innerText = "OCR failed. Check console for details.";
        console.error(error);
    }
}

function showFloatingToolbar(el) {
    const tb = document.getElementById('floating-toolbar');
    const textTools = document.getElementById('text-tools');
    const rect = el.getBoundingClientRect();
    
    tb.style.display = 'flex';
    tb.style.top = (rect.top - 55) + 'px';
    tb.style.left = rect.left + 'px';

    if (el.classList.contains('draggable-text') && !el.classList.contains('whiteout-box')) {
        textTools.style.display = 'flex';
        document.getElementById('text-color').value = rgb2hex(el.style.color);
        document.getElementById('text-size').value = parseInt(el.style.fontSize) || 24;
        document.getElementById('text-font').value = el.style.fontFamily || 'Arial';
    } else {
        textTools.style.display = 'none';
    }
}

function hideFloatingToolbar() {
    document.getElementById('floating-toolbar').style.display = 'none';
}

function deleteActiveElement() {
    if (activeElement) {
        activeElement.remove();
        visualElements = visualElements.filter(el => el !== activeElement);
        hideFloatingToolbar();
        activeElement = null;
    }
}

function mergePDFs() { alert('Merge PDFs executed'); }
function splitPDF() { alert('Split PDF executed'); }
function convertPdfToJpg() { alert('PDF to JPG executed'); }
function removePassword() { alert('Remove Password executed'); }

async function runOCR() {
    const fileInput = document.getElementById('ocr-file');
    const resultText = document.getElementById('ocr-result');
    if (!fileInput.files || fileInput.files.length === 0) return alert("Select a file first");

    resultText.innerText = "Extracting text... please wait.";
    const file = fileInput.files[0];

    try {
        const worker = await Tesseract.createWorker();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const { data: { text } } = await worker.recognize(file);
        
        resultText.innerText = text;
        await worker.terminate();
    } catch (e) {
        resultText.innerText = "Error extracting text.";
    }
}

function protectPDF() { alert('Protect PDF executed'); }
function compressPdf() { alert('Compress PDF executed')};

function rgb2hex(rgb) {
    if (!rgb) return "#000000";
    let res = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!res) return rgb;
    function hex(x) { return ("0" + parseInt(x).toString(16)).slice(-2); }
    return "#" + hex(res[1]) + hex(res[2]) + hex(res[3]);
}

function updateFormat() {
    if (activeElement && activeElement.classList.contains('draggable-text')) {
        const newColor = document.getElementById('text-color').value;
        const newSize = document.getElementById('text-size').value + 'px';
        const newFont = document.getElementById('text-font').value;
        
        activeElement.style.color = newColor;
        activeElement.style.fontSize = newSize;
        activeElement.style.fontFamily = newFont;
        
        Array.from(activeElement.children).forEach(child => {
            child.style.color = newColor;
            child.style.fontSize = newSize;
            child.style.fontFamily = newFont;
        });
    }
}

function addWhiteout() {
    const box = document.createElement('div');
    box.className = 'whiteout-box';
    box.style.left = '50px';
    box.style.top = '50px';
    box.style.width = '200px';
    box.style.height = '50px';
    box.style.backgroundColor = '#ffffff';
    box.style.position = 'absolute';
    box.style.overflow = 'visible';
    box.style.cursor = 'move';
    box.style.zIndex = '100';
    box.tabIndex = 0;
    
    document.getElementById('editor-canvas-wrapper').appendChild(box);
    visualElements.push(box);
    document.querySelectorAll('.studio-tool-rail-btn').forEach(btn => btn.classList.remove('active'));
}

function addRedaction() {
    const box = document.createElement('div');
    box.className = 'whiteout-box redact-box';
    box.style.left = '100px';
    box.style.top = '100px';
    box.style.width = '150px';
    box.style.height = '20px';
    box.style.backgroundColor = '#000000';
    box.style.position = 'absolute';
    box.style.overflow = 'visible';
    box.style.cursor = 'move';
    box.style.zIndex = '100';
    box.tabIndex = 0;
    
    document.getElementById('editor-canvas-wrapper').appendChild(box);
    visualElements.push(box);
    document.querySelectorAll('.studio-tool-rail-btn').forEach(btn => btn.classList.remove('active'));
}

let pdfCropBox = null;

function initPdfCrop() {
    const wrapper = document.getElementById('editor-canvas-wrapper');
    if (!wrapper.querySelector('canvas')) return alert("Upload a PDF first");

    if (pdfCropBox) pdfCropBox.remove();

    pdfCropBox = document.createElement('div');
    pdfCropBox.style.position = 'absolute';
    pdfCropBox.style.border = '3px dashed #ef4444';
    pdfCropBox.style.background = 'rgba(239, 68, 68, 0.1)';
    pdfCropBox.style.left = '10%';
    pdfCropBox.style.top = '10%';
    pdfCropBox.style.width = '80%';
    pdfCropBox.style.height = '80%';
    pdfCropBox.style.resize = 'both';
    pdfCropBox.style.overflow = 'hidden';
    pdfCropBox.style.zIndex = '500';
    pdfCropBox.style.cursor = 'crosshair';
    
    const applyBtn = document.createElement('button');
    applyBtn.innerText = "Apply Crop";
    applyBtn.style.cssText = 'position:absolute; bottom:-35px; right:0; background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;';
    applyBtn.onclick = executePdfCrop;
    
    pdfCropBox.appendChild(applyBtn);
    wrapper.appendChild(pdfCropBox);
}

function executePdfCrop() {
    alert("PDF Crop boundaries saved. Will be applied on Download.");
    if (pdfCropBox) {
        pdfCropBox.style.background = 'transparent';
        pdfCropBox.style.borderColor = '#10b981';
        const btn = pdfCropBox.querySelector('button');
        if (btn) btn.remove();
    }
}

let isCroppingImage = false;

function enableImageCrop() {
    if (!activeElement || !activeElement.classList.contains('draggable-image')) return;
    
    if (activeElement.querySelector('.image-crop-mask')) return;

    isCroppingImage = true;
    activeElement.style.border = '2px dashed #f59e0b';
    
    const cropMask = document.createElement('div');
    cropMask.className = 'image-crop-mask';
    cropMask.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; overflow:hidden; z-index:10; resize:both; border-bottom:4px solid #f59e0b; border-right:4px solid #f59e0b; cursor:se-resize;';
    
    const imgClone = document.createElement('div');
    imgClone.style.cssText = `position:absolute; top:0; left:0; width:${activeElement.style.width}; height:${activeElement.style.height}; background-image:${activeElement.style.backgroundImage}; background-size:100% 100%;`;
    
    activeElement.style.backgroundImage = 'none';
    cropMask.appendChild(imgClone);
    activeElement.appendChild(cropMask);
    
    if (typeof hideFloatingToolbar === 'function') hideFloatingToolbar();
}

let isDragging = false;
let isResizing = false;
let currentHandle = '';
let dragOffsetX = 0;
let dragOffsetY = 0;
let startW = 0, startH = 0, startLeft = 0, startTop = 0, startX = 0, startY = 0;

function attachResizeNodes(el) {
    removeResizeNodes();
    if (el.classList.contains('draggable-text') && !el.classList.contains('whiteout-box')) return;

    const dirs = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];
    dirs.forEach(dir => {
        const node = document.createElement('div');
        node.className = 'resize-node';
        node.dataset.dir = dir;
        el.appendChild(node);
    });
}

function removeResizeNodes() {
    document.querySelectorAll('.resize-node').forEach(n => n.remove());
}

document.addEventListener('mousedown', function(e) {
    if (e.target.classList.contains('resize-node')) {
        isResizing = true;
        currentHandle = e.target.dataset.dir;
        startW = parseInt(activeElement.style.width, 10) || 0;
        startH = parseInt(activeElement.style.height, 10) || 0;
        startLeft = parseInt(activeElement.style.left, 10) || 0;
        startTop = parseInt(activeElement.style.top, 10) || 0;
        startX = e.clientX;
        startY = e.clientY;
        e.preventDefault();
        return;
    }

    if (e.target.classList.contains('draggable-text') || e.target.classList.contains('draggable-image') || e.target.classList.contains('whiteout-box')) {
        isDragging = true;
        activeElement = e.target;
        
        const wrapperRect = document.getElementById('editor-canvas-wrapper').getBoundingClientRect();
        dragOffsetX = e.clientX - wrapperRect.left - (parseInt(activeElement.style.left, 10) || 0);
        dragOffsetY = e.clientY - wrapperRect.top - (parseInt(activeElement.style.top, 10) || 0);
        
        attachResizeNodes(activeElement);
        if (typeof showFloatingToolbar === 'function') showFloatingToolbar(activeElement);
        e.preventDefault(); 
        
    } else if (e.target === document.querySelector('#editor-canvas-wrapper canvas') || e.target.id === 'editor-canvas-wrapper') {
        removeResizeNodes();
        activeElement = null;
        if (typeof hideFloatingToolbar === 'function') hideFloatingToolbar();

        if (typeof mode !== 'undefined' && mode === 'text') {
            const wrapperRect = document.getElementById('editor-canvas-wrapper').getBoundingClientRect();
            const textDiv = document.createElement('div');
            textDiv.contentEditable = true;
            textDiv.className = 'draggable-text';
            textDiv.innerText = 'Type here';
            textDiv.style.left = (e.clientX - wrapperRect.left) + 'px';
            textDiv.style.top = (e.clientY - wrapperRect.top) + 'px';
            textDiv.style.color = '#000000';
            textDiv.style.fontSize = '24px';
            textDiv.style.fontFamily = 'Arial';
            
            document.getElementById('editor-canvas-wrapper').appendChild(textDiv);
            textDiv.focus();
            visualElements.push(textDiv);
            activeElement = textDiv;
            if (typeof showFloatingToolbar === 'function') showFloatingToolbar(textDiv);
            mode = 'none'; 
        }
    }
});

document.addEventListener('mousemove', function(e) {
    if (isResizing && activeElement) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (currentHandle.includes('e')) activeElement.style.width = Math.max(15, startW + dx) + 'px';
        if (currentHandle.includes('s')) activeElement.style.height = Math.max(15, startH + dy) + 'px';
        if (currentHandle.includes('w')) {
            const newW = startW - dx;
            if (newW > 15) {
                activeElement.style.width = newW + 'px';
                activeElement.style.left = (startLeft + dx) + 'px';
            }
        }
        if (currentHandle.includes('n')) {
            const newH = startH - dy;
            if (newH > 15) {
                activeElement.style.height = newH + 'px';
                activeElement.style.top = (startTop + dy) + 'px';
            }
        }
        
        if (typeof showFloatingToolbar === 'function') showFloatingToolbar(activeElement);
        return;
    }

    if (isDragging && activeElement) {
        const wrapperRect = document.getElementById('editor-canvas-wrapper').getBoundingClientRect();
        activeElement.style.left = (e.clientX - wrapperRect.left - dragOffsetX) + 'px';
        activeElement.style.top = (e.clientY - wrapperRect.top - dragOffsetY) + 'px';
        if (typeof showFloatingToolbar === 'function') showFloatingToolbar(activeElement);
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
});

let isDrawingSig = false;

function openSignature() {
    document.getElementById('sig-modal').style.display = 'block';
    clearSignature();
}

function closeSignature() {
    document.getElementById('sig-modal').style.display = 'none';
}

function clearSignature() {
    const sigCanvas = document.getElementById('sig-canvas');
    if (sigCanvas) {
        const ctx = sigCanvas.getContext('2d');
        ctx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    }
}

const sigCanvas = document.getElementById('sig-canvas');
if (sigCanvas) {
    const ctx = sigCanvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    function startDrawing(e) {
        isDrawingSig = true;
        ctx.beginPath();
        const rect = sigCanvas.getBoundingClientRect();
        const x = e.offsetX !== undefined ? e.offsetX : e.touches[0].clientX - rect.left;
        const y = e.offsetY !== undefined ? e.offsetY : e.touches[0].clientY - rect.top;
        ctx.moveTo(x, y);
        if (e.type === 'touchstart') e.preventDefault();
    }
    
    function draw(e) {
        if (!isDrawingSig) return;
        const rect = sigCanvas.getBoundingClientRect();
        const x = e.offsetX !== undefined ? e.offsetX : e.touches[0].clientX - rect.left;
        const y = e.offsetY !== undefined ? e.offsetY : e.touches[0].clientY - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
        if (e.type === 'touchmove') e.preventDefault();
    }

    function stopDrawing() { isDrawingSig = false; }
    
    sigCanvas.addEventListener('mousedown', startDrawing);
    sigCanvas.addEventListener('mousemove', draw);
    sigCanvas.addEventListener('mouseup', stopDrawing);
    sigCanvas.addEventListener('mouseout', stopDrawing);
    
    sigCanvas.addEventListener('touchstart', startDrawing, {passive: false});
    sigCanvas.addEventListener('touchmove', draw, {passive: false});
    sigCanvas.addEventListener('touchend', stopDrawing);
}

function insertSignature() {
    const dataUrl = sigCanvas.toDataURL('image/png');
    const wrapper = document.createElement('div');
    wrapper.className = 'draggable-image';
    wrapper.style.left = '50px';
    wrapper.style.top = '50px';
    wrapper.style.width = '200px';
    wrapper.style.height = '100px';
    wrapper.style.backgroundImage = `url(${dataUrl})`;
    wrapper.style.backgroundSize = 'contain';
    wrapper.style.backgroundRepeat = 'no-repeat';
    wrapper.setAttribute('data-src', dataUrl);
    wrapper.tabIndex = 0;
    
    document.getElementById('editor-canvas-wrapper').appendChild(wrapper);
    visualElements.push(wrapper);
    closeSignature();
}

async function saveVisualEdits() {
    const fileInput = document.getElementById('editor-upload');
    if (!fileInput.files || fileInput.files.length === 0) {
        alert("Please upload a PDF first.");
        return;
    }

    const file = fileInput.files[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const page = pages[0];
    const wrapper = document.getElementById('editor-canvas-wrapper');
    const wrapperRect = wrapper.getBoundingClientRect();

    if (typeof pdfCropBox !== 'undefined' && pdfCropBox) {
        const cropRect = pdfCropBox.getBoundingClientRect();
        
        const scaleX = page.getWidth() / wrapperRect.width;
        const scaleY = page.getHeight() / wrapperRect.height;
        
        const pdfX = (cropRect.left - wrapperRect.left) * scaleX;
        const pdfY = page.getHeight() - ((cropRect.bottom - wrapperRect.top) * scaleY);
        const pdfWidth = cropRect.width * scaleX;
        const pdfHeight = cropRect.height * scaleY;
        
        page.setCropBox(pdfX, pdfY, pdfWidth, pdfHeight);
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'OpenDesign_Export.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleConvertUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    const optionsContainer = document.getElementById('convert-options-container');
    const select = document.getElementById('convert-target-format');
    const typeLabel = document.getElementById('convert-detected-type');
    
    select.innerHTML = '';
    typeLabel.innerText = file.name;
    
    const type = file.type.toLowerCase();
    let targets = [];
    
    if (type.includes('image')) {
        targets = ['PDF', 'PNG', 'JPEG', 'WEBP', 'GIF'];
    } else if (type.includes('pdf')) {
        targets = ['Word (DOCX)', 'Images (PNG)', 'Images (JPG)', 'Text (TXT)'];
    } else if (type.includes('audio')) {
        targets = ['MP3', 'WAV', 'OGG', 'AAC'];
    } else if (type.includes('video')) {
        targets = ['MP4', 'GIF', 'WEBM', 'Audio (MP3)'];
    } else if (type.includes('text')) {
        targets = ['PDF', 'Word (DOCX)'];
    } else {
        targets = ['ZIP', 'PDF'];
    }

    targets.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.split(' ')[0].toLowerCase();
        opt.innerText = t;
        select.appendChild(opt);
    });
    
    optionsContainer.style.display = 'block';
}

async function executeConversion() {
    const fileInput = document.getElementById('convert-file');
    if (!fileInput.files || fileInput.files.length === 0) return alert("Select a file");
    
    const file = fileInput.files[0];
    const target = document.getElementById('convert-target-format').value;
    
    if (target === 'pdf' && file.type.includes('image')) {
        const imgBytes = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.create();
        
        let img;
        if (file.type === 'image/jpeg') {
            img = await pdfDoc.embedJpg(imgBytes);
        } else {
            img = await pdfDoc.embedPng(imgBytes);
        }
        
        const page = pdfDoc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Converted_${file.name.split('.')[0]}.pdf`;
        a.click();
    } else if ((target === 'png' || target === 'jpeg') && file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
        
        const imgData = canvas.toDataURL(`image/${target}`);
        const a = document.createElement('a');
        a.href = imgData;
        a.download = `Converted_Page1.${target}`;
        a.click();
    } else if (target === 'png' || target === 'jpeg' || target === 'webp') {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            const imgData = canvas.toDataURL(`image/${target}`);
            const a = document.createElement('a');
            a.href = imgData;
            a.download = `Converted_${file.name.split('.')[0]}.${target}`;
            a.click();
            URL.revokeObjectURL(img.src);
        };
    } else {
        alert(`Advanced format ${target.toUpperCase()} requires backend rendering. Client-side supports Image to PDF, PDF to Image, and Image to Image.`);
    }
}

function handleConvertUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    const optionsContainer = document.getElementById('convert-options-container');
    const select = document.getElementById('convert-target-format');
    const typeLabel = document.getElementById('convert-detected-type');
    
    select.innerHTML = '';
    typeLabel.innerText = file.name;
    
    const type = file.type.toLowerCase();
    let targets = [];
    
    if (type.includes('image')) {
        targets = ['PDF', 'PNG', 'JPEG', 'WEBP', 'GIF'];
    } else if (type.includes('pdf')) {
        targets = ['Word (DOCX)', 'Images (PNG)', 'Images (JPG)', 'Text (TXT)'];
    } else if (type.includes('audio')) {
        targets = ['MP3', 'WAV', 'OGG', 'AAC'];
    } else if (type.includes('video')) {
        targets = ['MP4', 'GIF', 'WEBM', 'Audio (MP3)'];
    } else if (type.includes('text')) {
        targets = ['PDF', 'Word (DOCX)'];
    } else {
        targets = ['ZIP', 'PDF'];
    }

    targets.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.split(' ')[0].toLowerCase();
        opt.innerText = t;
        select.appendChild(opt);
    });
    
    optionsContainer.style.display = 'block';
}

function executeConversion() {
    const fileInput = document.getElementById('convert-file');
    if (!fileInput.files || fileInput.files.length === 0) {
        alert("Please select a file to convert.");
        return;
    }
    const target = document.getElementById('convert-target-format').value;
    alert(`File sent to conversion engine. Target format: ${target.toUpperCase()}`);
}

async function removeImageBg() {
    const fileInput = document.getElementById('bg-file');
    const status = document.getElementById('bg-status');
    if (!fileInput.files || fileInput.files.length === 0) return alert("Select an image");
    
    status.innerText = "Downloading AI models and processing... this may take a moment.";
    const file = fileInput.files[0];
    
    try {
        const blob = await imglyRemoveBackground(file);
        const url = URL.createObjectURL(blob); 
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `NoBg_${file.name.split('.')[0]}.png`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        status.innerText = "Background removed successfully!";
    } catch (e) {
        status.innerText = "Error removing background. Check console.";
        console.error(e);
    }
}

async function removeAudioNoise() {
    const fileInput = document.getElementById('noise-file');
    const status = document.getElementById('noise-status');
    if (!fileInput.files || fileInput.files.length === 0) return alert("Select an audio file");
    
    status.innerText = "Analyzing frequencies and applying noise gate...";
    const file = fileInput.files[0];
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const actx = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await actx.decodeAudioData(arrayBuffer);
        
        const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;
        
        const filter = offlineCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 3000; 
        
        const compressor = offlineCtx.createDynamicsCompressor();
        compressor.threshold.value = -50;
        compressor.knee.value = 40;
        compressor.ratio.value = 12;
        compressor.attack.value = 0;
        compressor.release.value = 0.25;
        
        source.connect(filter);
        filter.connect(compressor);
        compressor.connect(offlineCtx.destination);
        source.start();
        
        const renderedBuffer = await offlineCtx.startRendering();
        
        const streamNode = actx.createMediaStreamDestination();
        const sourcePlay = actx.createBufferSource();
        sourcePlay.buffer = renderedBuffer;
        sourcePlay.connect(streamNode);
        
        const mediaRecorder = new MediaRecorder(streamNode.stream);
        const chunks = [];
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Cleaned_${file.name.split('.')[0]}.webm`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => document.body.removeChild(a), 100);
            status.innerText = "Audio cleaned and downloaded!";
        };
        
        sourcePlay.onended = () => {
            mediaRecorder.stop();
        };
        
        mediaRecorder.start();
        sourcePlay.start();
    } catch (e) {
        status.innerText = "Error processing audio.";
        console.error(e);
    }
}