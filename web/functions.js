function UndoDrawing() {
    if (paths.length > 0) {
        paths.pop();
        recalculateBoundingBoxes();
        drawAllBoundingBoxes();
    }
}

function mergeBoxes() {
    boxes = normalizeBoxes(boxes);
    drawAllBoundingBoxes();
}

function unmergeBoxes() {
    recalculateBoundingBoxes({ preserveSeparateBoxes: true });
    drawAllBoundingBoxes();
}

function recalculateBoundingBoxes(options = {}) {
    const { preserveSeparateBoxes = false } = options;
    const nextBoxes = paths
        .map(path => calculateBoundingBox(path))
        .filter(box => box !== null);

    boxes = preserveSeparateBoxes ? nextBoxes : normalizeBoxes(nextBoxes);
}

function normalizeBoxes(inputBoxes) {
    const pendingBoxes = inputBoxes.map(cloneBox);
    const normalizedBoxes = [];

    while (pendingBoxes.length > 0) {
        let currentBox = pendingBoxes.pop();
        let mergedBox = true;

        while (mergedBox) {
            mergedBox = false;

            for (let i = 0; i < pendingBoxes.length; i++) {
                if (shouldMergeBoxes(currentBox, pendingBoxes[i])) {
                    currentBox = combineBoxes(currentBox, pendingBoxes[i]);
                    pendingBoxes.splice(i, 1);
                    mergedBox = true;
                    break;
                }
            }

            if (mergedBox) {
                continue;
            }

            for (let i = 0; i < normalizedBoxes.length; i++) {
                if (shouldMergeBoxes(currentBox, normalizedBoxes[i])) {
                    currentBox = combineBoxes(currentBox, normalizedBoxes[i]);
                    normalizedBoxes.splice(i, 1);
                    mergedBox = true;
                    break;
                }
            }
        }

        normalizedBoxes.push(currentBox);
    }

    return normalizedBoxes.sort((leftBox, rightBox) => leftBox.minX - rightBox.minX);
}

function shouldMergeBoxes(leftBox, rightBox) {
    return isClose(leftBox, rightBox) || isOverlapping(leftBox, rightBox) || isMostlyWithin(leftBox, rightBox);
}

function combineBoxes(leftBox, rightBox) {
    return {
        minX: Math.min(leftBox.minX, rightBox.minX),
        minY: Math.min(leftBox.minY, rightBox.minY),
        maxX: Math.max(leftBox.maxX, rightBox.maxX),
        maxY: Math.max(leftBox.maxY, rightBox.maxY),
        predicted_label: leftBox.predicted_label || rightBox.predicted_label || ''
    };
}

function cloneBox(box) {
    return {
        minX: box.minX,
        minY: box.minY,
        maxX: box.maxX,
        maxY: box.maxY,
        predicted_label: box.predicted_label || ''
    };
}

function isOverlapping(leftBox, rightBox) {
    return !(
        leftBox.maxX < rightBox.minX ||
        rightBox.maxX < leftBox.minX ||
        leftBox.maxY < rightBox.minY ||
        rightBox.maxY < leftBox.minY
    );
}

function isMostlyWithin(leftBox, rightBox) {
    return boxContains(leftBox, rightBox, 0.85) || boxContains(rightBox, leftBox, 0.85);
}

function boxContains(containerBox, innerBox, threshold) {
    const overlapWidth = Math.max(0, Math.min(containerBox.maxX, innerBox.maxX) - Math.max(containerBox.minX, innerBox.minX));
    const overlapHeight = Math.max(0, Math.min(containerBox.maxY, innerBox.maxY) - Math.max(containerBox.minY, innerBox.minY));
    const overlapArea = overlapWidth * overlapHeight;
    const innerArea = Math.max(1, (innerBox.maxX - innerBox.minX) * (innerBox.maxY - innerBox.minY));

    return overlapArea / innerArea >= threshold;
}

function imageProcessing() {}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function numericalIntegrate(f, a, b, n = 1000) {
    const h = (b - a) / n;
    let sum = 0.5 * (f(a) + f(b));
    for (let i = 1; i < n; i++) {
        sum += f(a + i * h);
    }
    return sum * h;
}
