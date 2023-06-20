import { getStroke } from 'perfect-freehand'
/**
 * @type HTMLCanvasElement
 */
const canvas = document.getElementById('canvas')

const clearButton = document.getElementById('clear-button')

const context = canvas.getContext('2d')

let drawing = false;
let points = [];

export function getCanvasData() {
    const downscaler = document.createElement('canvas')
    const ctx = downscaler.getContext('2d')
    downscaler.width = 28;
    downscaler.height = 28;

    const originalImageData = context.getImageData(0, 0, 200, 200);
    const downscaledImageData = ctx.createImageData(28, 28);
    const scale = 200 / 28;

    for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
            const origX = Math.floor(x * scale)
            const origY = Math.floor(y * scale);

            const origIndex = (origY * 200 + origX) * 4;
            const downscaledIndex = (y * 28 + x) * 4;

            downscaledImageData.data[downscaledIndex] = originalImageData.data[origIndex];
            downscaledImageData.data[downscaledIndex + 1] = originalImageData.data[origIndex + 1];
            downscaledImageData.data[downscaledIndex + 2] = originalImageData.data[origIndex + 2];
            downscaledImageData.data[downscaledIndex + 3] = originalImageData.data[origIndex + 3];
        }
    }

    const tensorData = new Float32Array(28 * 28);

    for (let i = 0; i < tensorData.length; i++) {
        tensorData[i] = downscaledImageData.data[i * 4 + 3]/255;
    }

    return tensorData;
}

/**
  * @param {PointerEvent} event
  */
function onPointerMove(event) {
    if (drawing) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.x
        const y = event.clientY - rect.y

        points.push([x, y])
    }
}

function onPointerDown() {
    drawing = true
}

function onPointerUp() {
    drawing = false
    points = []
}

function clearCanvas() {
    context.clearRect(0, 0, 200, 200)
}


canvas.addEventListener('pointerdown', onPointerDown)
canvas.addEventListener('pointerup', onPointerUp)
canvas.addEventListener('pointermove', onPointerMove)
canvas.addEventListener('pointerout', onPointerUp)

clearButton.addEventListener('click', clearCanvas)

function draw() {
    const stroke = getStroke(points)
    if (stroke.length) {
        context.beginPath()

        const [x, y] = stroke[0]
        context.moveTo(x, y);

        stroke.slice(1).forEach(p => {
            const [x, y] = p
            context.lineTo(x, y)
        })

        context.fill()
    }

    requestAnimationFrame(draw)
}

draw()

