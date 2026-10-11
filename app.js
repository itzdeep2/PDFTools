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