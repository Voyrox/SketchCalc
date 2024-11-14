const canvas = document.getElementById('drawingCanvas');
const timeElap = document.getElementById('elapsedTime');
const context = canvas.getContext('2d');
var startTime, endTime;
const dpr = window.devicePixelRatio || 1;

const rect = canvas.getBoundingClientRect();

canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;

context.scale(dpr, dpr);

let drawing = false;
let currentPath = [];
let paths = [];
let boxes = [];
let lastBoxTime = 0;

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', draw);

function getMousePos(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left),
        y: (event.clientY - rect.top)
    };
}

function startDrawing(event) {
    drawing = true;
    currentPath = [];
    context.beginPath();
    const pos = getMousePos(event);
    context.moveTo(pos.x, pos.y);
}

function stopDrawing() {
    if (!drawing) return;
    drawing = false;
    paths.push(currentPath);
    const newBox = calculateBoundingBox(currentPath);
    mergeBoundingBoxes(newBox);
    lastBoxTime = performance.now();
}

function draw(event) {
    if (!drawing) return;

    const pos = getMousePos(event);

    context.lineWidth = 5;
    context.lineCap = 'round';
    context.strokeStyle = 'white';

    context.lineTo(pos.x, pos.y);
    context.stroke();
    context.beginPath();
    context.moveTo(pos.x, pos.y);

    currentPath.push({ x: pos.x, y: pos.y });
}

function calculateBoundingBox(path) {
    if (path.length === 0) return null;

    let minX = path[0].x;
    let minY = path[0].y;
    let maxX = path[0].x;
    let maxY = path[0].y;

    for (const point of path) {
        if (point.x < minX) minX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.x > maxX) maxX = point.x;
        if (point.y > maxY) maxY = point.y;
    }

    return { minX, minY, maxX, maxY, predicted_label: '' };
}

function mergeBoundingBoxes(newBox) {
    if (!newBox) return;

    let merged = false;
    let toMerge = [newBox];

    while (toMerge.length > 0) {
        const currentBox = toMerge.pop();
        for (let i = 0; i < boxes.length; i++) {
            if (isClose(boxes[i], currentBox)) {
                boxes[i].minX = Math.min(boxes[i].minX, currentBox.minX);
                boxes[i].minY = Math.min(boxes[i].minY, currentBox.minY);
                boxes[i].maxX = Math.max(boxes[i].maxX, currentBox.maxX);
                boxes[i].maxY = Math.max(boxes[i].maxY, currentBox.maxY);
                toMerge.push(boxes[i]);
                boxes.splice(i, 1);
                merged = true;
                break;
            }
        }

        if (!merged) {
            boxes.push(currentBox);
        }
        merged = false;
    }

    drawAllBoundingBoxes();
}

function isClose(box1, box2) {
    const xdistanceThreshold = 90;
    const ydistanceThreshold = 50;

    const centerX1 = (box1.minX + box1.maxX) / 2;
    const centerX2 = (box2.minX + box2.maxX) / 2;

    const centerY1 = (box1.minY + box1.maxY) / 2;
    const centerY2 = (box2.minY + box2.maxY) / 2;

    if (Math.abs(centerY1 - centerY2) > ydistanceThreshold) return false;
    
    const distance = Math.abs(centerX1 - centerX2);
    return distance < xdistanceThreshold;
}

function drawAllBoundingBoxes() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    redrawAllPaths();

    context.strokeStyle = 'red';
    context.lineWidth = 2;

    for (const box of boxes) {
        context.strokeRect(box.minX, box.minY, box.maxX - box.minX, box.maxY - box.minY);
        if (box.predicted_label) {
            context.fillStyle = 'black';
            context.font = '16px Arial';
            context.fillText(box.predicted_label, box.minX, box.minY - 5);
        }
    }
}

function redrawAllPaths() {
    for (const path of paths) {
        context.beginPath();
        context.moveTo(path[0].x, path[0].y);
        for (const point of path) {
            context.lineTo(point.x, point.y);
        }
        context.strokeStyle = 'white';
        context.lineWidth = 5;
        context.stroke();
        context.beginPath();
    }
}

function sendBoxToServer(box, callback) {
    startTime = new Date();
    const boxCanvas = document.createElement('canvas');
    const boxContext = boxCanvas.getContext('2d');
    const width = 110;
    const height = 100;
    
    const boxWidth = box.maxX - box.minX;
    const boxHeight = box.maxY - box.minY;

    boxCanvas.width = width;
    boxCanvas.height = height;

    boxContext.fillStyle = getRandomColor();
    boxContext.fillRect(0, 0, width, height);

    const scaleX = width / boxWidth;
    const scaleY = height / boxHeight;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = boxWidth * scale;
    const scaledHeight = boxHeight * scale;

    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;

    boxContext.drawImage(canvas, box.minX * dpr, box.minY * dpr, boxWidth * dpr, boxHeight * dpr, offsetX, offsetY, scaledWidth, scaledHeight);

    boxCanvas.toBlob(function(blob) {
        const formData = new FormData();
        formData.append('file', blob, 'box.png');

        fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            callback(null, data.predicted_label);
        })
        .catch((error) => {
            callback(error, null);
        });
    }, 'image/png');
}

function parseDrawing() {
    const outputbox = document.getElementById('parseOutput');
    const evaluationOutput = document.getElementById('evaluationOutput');
    outputbox.value = 'Parsed drawing data...';
    let output = '';

    boxes.sort((a, b) => a.minX - b.minX);
    let orderedPredictedLabels = [];

    let promises = boxes.map(box => {
        return new Promise((resolve, reject) => {
            sendBoxToServer(box, (error, predicted_label) => {
                if (error) {
                    console.error('Error:', error);
                    reject(error);
                    return;
                }
                box.predicted_label = predicted_label;
                orderedPredictedLabels.push({
                    minX: box.minX,
                    label: predicted_label
                });
                evaluationOutput.value += `Box: (${box.minX}, ${box.minY}, ${box.maxX}, ${box.maxY}) - Predicted Label: ${predicted_label}\n`;
                resolve();
            });
        });
    });

    Promise.all(promises).then(() => {
        orderedPredictedLabels.sort((a, b) => a.minX - b.minX);
        output = orderedPredictedLabels.map(item => item.label).join('');

        outputbox.value = output;
        drawAllBoundingBoxes();

        try {
            if (output.includes('∫')) {
                const integralRegex = /(\d+),\s*(\d+)\s*∫([\s\S]*?)dx/;
                const match = output.match(integralRegex);
                if (match) {
                    const lowerLimit = parseFloat(match[1].trim());
                    const upperLimit = parseFloat(match[2].trim());
                    const integrand = match[3].trim();
                    
                    const func = math.compile(integrand);
                    const integralResult = numericalIntegrate(x => func.evaluate({ x }), lowerLimit, upperLimit);
                    evaluationOutput.value = integralResult;
                } else {
                    throw new Error('Integral format is incorrect.');
                }
            } else {
                if (output.includes('÷')) {
                    output = output.replace(/÷/g, '/');
                }
                if (output.includes('π')) {
                    output = output.replace(/π/g, 'pi');
                }
                if (output.includes('∞')) {
                    output = output.replace(/∞/g, 'Infinity');
                }
                if (output.includes('√')) {
                    output = output.replace(/√/g, 'sqrt');
                }
                if (output.includes('Σ')) {
                    output = output.replace(/Σ/g, 'sum');
                }
                const calculatedOutput = math.evaluate(output);
                evaluationOutput.value = calculatedOutput;
            }
        } catch (e) {
            console.error('Error in calculation:', e);
            evaluationOutput.value = 'Error in calculation';
        }
    }).catch(error => {
        console.error('Error processing boxes:', error);
    });
    endTime = new Date();
    var timeDiff = endTime - startTime;
    timeElap.value = timeDiff + " ms";
}

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    paths = [];
    boxes = [];
}

function parseAndEvaluate() {
    document.getElementById('evaluationOutput').value = 'Evaluation result...';
}

function measureElapsedTime(callback) {
    const startTime = performance.now();
    callback();
    const endTime = performance.now();
    document.getElementById('elapsedTime').value = (endTime - startTime).toFixed(2) + ' ms';
}

function SaveToDataset() {
    boxes.forEach(box => {
        const boxCanvas = document.createElement('canvas');
        const boxContext = boxCanvas.getContext('2d');
        const width = 110;
        const height = 100;
        
        const boxWidth = box.maxX - box.minX;
        const boxHeight = box.maxY - box.minY;

        boxCanvas.width = width;
        boxCanvas.height = height;

        boxContext.fillStyle = getRandomColor();
        boxContext.fillRect(0, 0, width, height);

        const scaleX = width / boxWidth;
        const scaleY = height / boxHeight;
        const scale = Math.min(scaleX, scaleY);

        const scaledWidth = boxWidth * scale;
        const scaledHeight = boxHeight * scale;

        const offsetX = (width - scaledWidth) / 2;
        const offsetY = (height - scaledHeight) / 2;

        boxContext.drawImage(canvas, box.minX * dpr, box.minY * dpr, boxWidth * dpr, boxHeight * dpr, offsetX, offsetY, scaledWidth, scaledHeight);

        const label = prompt('Enter a label for this box:');

        boxCanvas.toBlob(function(blob) {
            const formData = new FormData();
            formData.append('file', blob, 'box.png');
            formData.append('label', label);

            fetch('http://127.0.0.1:5000/save', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                callback(null, data.predicted_label);
            })
            .catch((error) => {
                callback(error, null);
            });
        }, 'image/png');
    });
    drawAllBoundingBoxes();
}
