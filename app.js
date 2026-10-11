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