window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', handleRoute);

function handleRoute() {
    const hash = window.location.hash || '#dashboard';
    
    document.getElementById('dashboard').style.display = hash === '#dashboard' ? 'block' : 'none';
    
    document.getElementById('nav-bar').style.display = (hash === '#dashboard' || hash === '#add-text-sec') ? 'none' : 'block';
    
    const sections = document.querySelectorAll('.tool-section');
    sections.forEach(sec => sec.style.display = 'none');
    
    if (hash !== '#dashboard') {
        const target = document.getElementById(hash.substring(1));
        if (target) target.style.display = 'block';
    }

    if (hash === '#add-text-sec') {
        document.body.style.padding = '0';
    } else {
        document.body.style.padding = '40px 20px';
    }
}

function goHome() {
window.location.hash = '#dashboard';
}

async function mergePDFs() {
const files = document.getElementById('merge-files').files;
if (files.length < 2) {
alert("pleas select at least 2 files");
return;
}

const mergedPdf = await PDFLib.PDFDocument.create();

for (let i = 0; i < files.length; i++) {
const arrayBuffer = await files[i].arrayBuffer();
const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
copiedPages.forEach((page) => mergedPdf.addPage(page));
}

const mergedPdfFile = await mergedPdf.save();
downloadFile(mergedPdfFile, "merged_output.pdf", "application/pdf");
}

function downloadFile(data, filename, type) {
const blob = new Blob([data], { type: type });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = filename;
a.click();
URL.revokeObjectURL(url);
}
async function splitPDF() {
const file = document.getElementById('split-file').files[0];
if (!file) return;

const arrayBuffer = await file.arrayBuffer();
const pdf = await PDFLib.PDFDocument.load(arrayBuffer);

const newPdf = await PDFLib.PDFDocument.create();
const [firstPage] = await newPdf.copyPages(pdf, [0]);
newPdf.addPage(firstPage);

const splitBytes = await newPdf.save();
downloadFile(splitBytes, "split_page_1.pdf", "application/pdf");
}

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

async function convertPdfToJpg() {
const file = document.getElementById('jpg-file').files[0];
if (!file) return;

const fileReader = new FileReader();
fileReader.onload = async function() {
const typedarray = new Uint8Array(this.result);
const pdf = await pdfjsLib.getDocument(typedarray).promise;
const page = await pdf.getPage(1);

const viewport = page.getViewport({scale: 1.5});
const canvas = document.getElementById('pdf-canvas');
const context = canvas.getContext('2d');
canvas.height = viewport.height;
canvas.width = viewport.width;

await page.render({canvasContext: context, viewport: viewport}).promise;

canvas.toBlob(function(blob) {
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = "converted_image.jpg";
a.click();
}, 'image/jpeg');
};
fileReader.readAsArrayBuffer(file);
}
async function removePassword() {
const file = document.getElementById('unlock-file').files[0];
const pass = document.getElementById('pdf-pass').value;
if (!file || !pass) return;

const arrayBuffer = await file.arrayBuffer();
const pdf = await PDFLib.PDFDocument.load(arrayBuffer, { password: pass });

const unlockedBytes = await pdf.save();
downloadFile(unlockedBytes, "unlocked.pdf", "application/pdf");
}
async function runOCR() {
const file = document.getElementById('ocr-file').files[0];
if (!file) return;

document.getElementById('ocr-result').innerText = "processing... this might take a minute";

let targetForOcr = file;

if (file.type === "application/pdf") {
const arrayBuffer = await file.arrayBuffer();
const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
const page = await pdf.getPage(1);

const viewport = page.getViewport({scale: 1.5});
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
canvas.height = viewport.height;
canvas.width = viewport.width;

await page.render({canvasContext: context, viewport: viewport}).promise;
targetForOcr = canvas.toDataURL('image/jpeg');
}

const worker = await Tesseract.createWorker();
await worker.loadLanguage('eng');
await worker.initialize('eng');

const { data: { text } } = await worker.recognize(targetForOcr);
document.getElementById('ocr-result').innerText = text;
await worker.terminate();
}

async function compressPdf() {
const file = document.getElementById('compress-file').files[0];
if (!file) return;

const arrayBuffer = await file.arrayBuffer();
const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

const compressedBytes = await pdfDoc.save({ useObjectStreams: false });
downloadFile(compressedBytes, "compressed.pdf", "application/pdf");
}

let currentPdfDoc = null;
let currentPdfBytes = null;
let visualElements = [];

document.getElementById('editor-upload').addEventListener('change', async function(e) {
const file = e.target.files[0];
if (!file) return;

currentPdfBytes = await file.arrayBuffer();
const pdf = await pdfjsLib.getDocument(currentPdfBytes).promise;
const page = await pdf.getPage(1);

const viewport = page.getViewport({scale: 1.5});
const wrapper = document.getElementById('editor-canvas-wrapper');
wrapper.innerHTML = ''; 

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
canvas.height = viewport.height;
canvas.width = viewport.width;
wrapper.appendChild(canvas);

await page.render({canvasContext: context, viewport: viewport}).promise;
});
let mode = 'none';

function enableTextMode() {
    mode = 'text';
}


document.getElementById('editor-canvas-wrapper').addEventListener('click', function(e) {
    if (e.target === document.querySelector('#editor-canvas-wrapper canvas')) {
        if (typeof hideFloatingToolbar === 'function') hideFloatingToolbar();
        const wrapperRect = document.getElementById('editor-canvas-wrapper').getBoundingClientRect();
        const x = e.clientX - wrapperRect.left;
        const y = e.clientY - wrapperRect.top;

        if (mode === 'text') {
            const textDiv = document.createElement('div');
            textDiv.contentEditable = true;
            textDiv.className = 'draggable-text';
            textDiv.innerText = 'Type here';
            textDiv.style.left = x + 'px';
            textDiv.style.top = y + 'px';
            textDiv.style.color = '#000000';
            textDiv.style.fontSize = '24px';
            textDiv.style.fontFamily = 'Arial';
            
            document.getElementById('editor-canvas-wrapper').appendChild(textDiv);
            textDiv.focus();
            visualElements.push(textDiv);
            if (typeof showFloatingToolbar === 'function') showFloatingToolbar(textDiv);
            mode = 'none'; 
        } else if (mode === 'whiteout') {
            const box = document.createElement('div');
            box.className = 'whiteout-box draggable-text';
            box.style.left = x + 'px';
            box.style.top = y + 'px';
            box.style.width = '150px';
            box.style.height = '40px';
            box.tabIndex = 0; 
            
            document.getElementById('editor-canvas-wrapper').appendChild(box);
            visualElements.push(box);
            mode = 'none';
        }
    } else if (e.target.classList.contains('draggable-text') || e.target.classList.contains('draggable-image')) {
        activeElement = e.target;
        if (e.target.classList.contains('draggable-text') && typeof showFloatingToolbar === 'function') {
            showFloatingToolbar(e.target);
        } else if (typeof hideFloatingToolbar === 'function') {
            hideFloatingToolbar();
        }
    }
});

let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

document.addEventListener('mousedown', function(e) {
    if (e.target.classList.contains('draggable-text') || e.target.classList.contains('draggable-image') || e.target.classList.contains('whiteout-box')) {
        
        const rect = e.target.getBoundingClientRect();
        if ((e.target.classList.contains('draggable-image') || e.target.classList.contains('whiteout-box')) && 
            e.clientX > rect.right - 20 && e.clientY > rect.bottom - 20) {
            return; 
        }

        if (e.target.classList.contains('draggable-text') && document.activeElement === e.target) {
            return; 
        }

        isDragging = true;
        activeElement = e.target;
        
        const wrapperRect = document.getElementById('editor-canvas-wrapper').getBoundingClientRect();
        const elementLeft = parseInt(activeElement.style.left, 10) || 0;
        const elementTop = parseInt(activeElement.style.top, 10) || 0;
        
        dragOffsetX = e.clientX - wrapperRect.left - elementLeft;
        dragOffsetY = e.clientY - wrapperRect.top - elementTop;
        
        e.preventDefault(); 
    }
});

document.addEventListener('mousemove', function(e) {
    if (isDragging && activeElement) {
        const wrapperRect = document.getElementById('editor-canvas-wrapper').getBoundingClientRect();
        const newX = e.clientX - wrapperRect.left - dragOffsetX;
        const newY = e.clientY - wrapperRect.top - dragOffsetY;
        
        activeElement.style.left = newX + 'px';
        activeElement.style.top = newY + 'px';
        
        if (activeElement.classList.contains('draggable-text') && typeof showFloatingToolbar === 'function') {
            showFloatingToolbar(activeElement);
        }
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});


document.addEventListener('focusin', function(e) {
    if (e.target.classList.contains('draggable-text')) {
        activeElement = e.target;
        document.getElementById('text-color').value = rgb2hex(activeElement.style.color);
        document.getElementById('text-size').value = parseInt(activeElement.style.fontSize);
    }
});

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

function rgb2hex(rgb) {
    if (!rgb || rgb.indexOf('rgb') === -1) return '#000000';
    const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return '#000000';
    return "#" + ("0" + parseInt(match[1], 10).toString(16)).slice(-2) +
                 ("0" + parseInt(match[2], 10).toString(16)).slice(-2) +
                 ("0" + parseInt(match[3], 10).toString(16)).slice(-2);
}
document.addEventListener('focusout', function(e) {
if (e.target.classList.contains('draggable-text') && e.target.tagName.toLowerCase() === 'div') {
if (e.target.innerText.trim() === '') {
e.target.remove();
visualElements = visualElements.filter(el => el !== e.target);
activeElement = null;
}
}
});

document.querySelectorAll('.drop-zone').forEach(zone => {
    const fileInput = zone.querySelector('input[type="file"]');
    const textDesc = zone.querySelector('p');

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', () => {
        zone.classList.remove('dragover');
    });

    if (fileInput) {
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                textDesc.innerText = fileInput.files.length === 1 
                    ? fileInput.files[0].name 
                    : `${fileInput.files.length} files selected`;
                textDesc.style.color = '#4f46e5';
            }
        });
    }
});

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
    const rect = el.getBoundingClientRect();
    tb.style.display = 'flex';
    tb.style.top = (rect.top - 50) + 'px';
    tb.style.left = rect.left + 'px';

    if (el.tagName.toLowerCase() === 'div' && el.classList.contains('draggable-text')) {
        document.getElementById('text-color').value = rgb2hex(el.style.color);
        document.getElementById('text-size').value = parseInt(el.style.fontSize) || 24;
        document.getElementById('text-font').value = el.style.fontFamily || 'Arial';
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

function addWhiteout() {
    const box = document.createElement('div');
    box.className = 'whiteout-box';
    box.style.left = '50px';
    box.style.top = '50px';
    box.style.width = '200px';
    box.style.height = '50px';
    box.style.backgroundColor = '#ffffff';
    box.style.border = '1px solid #999';
    box.style.position = 'absolute';
    box.style.resize = 'both';
    box.style.overflow = 'hidden';
    box.style.cursor = 'move';
    box.style.zIndex = '100';
    box.tabIndex = 0;
    
    document.getElementById('editor-canvas-wrapper').appendChild(box);
    visualElements.push(box);
    document.querySelectorAll('.studio-tool-rail-btn').forEach(btn => btn.classList.remove('active'));
}

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
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    
    function getPos(e) {
        const rect = sigCanvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    sigCanvas.addEventListener('mousedown', function(e) {
        isDrawingSig = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    });
    
    sigCanvas.addEventListener('mousemove', function(e) {
        if (isDrawingSig) {
            const pos = getPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }
    });
    
    sigCanvas.addEventListener('mouseup', () => isDrawingSig = false);
    sigCanvas.addEventListener('mouseout', () => isDrawingSig = false);
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
    wrapper.setAttribute('data-src', dataUrl);
    wrapper.tabIndex = 0;
    
    document.getElementById('editor-canvas-wrapper').appendChild(wrapper);
    visualElements.push(wrapper);
    closeSignature();
}