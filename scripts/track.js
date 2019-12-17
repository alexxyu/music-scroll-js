const faceDetectionConfidenceThresh = 0.4;
const gestureThresh = 15;
const timeThresh = 5000;

// Function to change which PDF page is displayed
async function renderPage(page) {

    let canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    const viewport = page.getViewport({scale: 1.0});
    const scale = window.screen.availHeight / viewport.height;
    const scaledViewport = page.getViewport({scale: scale});

    // Prepare canvas using PDF page dimensions
    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;

    // Render PDF page into canvas context
    let renderContext = {
        canvasContext: context,
        viewport: scaledViewport
    };

    await page.render(renderContext);
}

function fullscreen() {
    if(document.fullscreenEnabled) {
        document.getElementById("canvas").requestFullscreen();
    }
    else 
        alert("Your browser does not have fullscreen enabled.");
}

// Function to check if face movement constitutes a page turn signal
function isGesture(currDetection, prevDetection, thresh) {
    if(typeof currDetection == 'undefined' || typeof prevDetection == 'undefined')
        return false;

    const rect1 = currDetection.box;
    let x1 = rect1._x + rect1._width/2;
    let y1 = rect1._y + rect1._height/2;

    const rect2 = prevDetection.box;
    let x2 = rect2._x + rect2._width/2;
    let y2 = rect2._y + rect2._height/2;

    if(Math.abs(y1 - y2) < thresh)
        return false;
    return y1 - y2;
}

let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('fileInput');

// Handle PDF file upload
inputElement.addEventListener('change', (e) => {
    
    pdfjsLib.getDocument(URL.createObjectURL(e.target.files[0])).promise.then(function(pdf) {

        const numPages = pdf.numPages;
        let currPage = 1;

        // Render first page
        pdf.getPage(currPage).then(function(page) {
            renderPage(page);
            inputElement.remove();
            document.getElementsByTagName('footer')[0].remove();
            document.getElementById('controls').style.display = 'block';
        });

        // Load face models and begin camera input
        const video = document.getElementById('video');
        Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'), 
            faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]).then(startVideo);

        function startVideo() {
            navigator.getUserMedia(
                { video: {} },
                stream => video.srcObject = stream,
                err => console.error(err)
            )
        }

        video.addEventListener('play', () => {
            const displaySize = {width: video.width, height: video.height};

            let prevDetection = undefined;
            let prevGestureTime = Date.now();

            // Tracks face every 100 ms
            setInterval(async () => {
                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({scoreThreshold: faceDetectionConfidenceThresh}));
                const resizedDetections = faceapi.resizeResults(detections, displaySize);

                const currTime = Date.now();

                // Only checks for gestures after time threshold has been surpassed
                if(currTime - prevGestureTime >= timeThresh) {
                    let hasGestured = isGesture(resizedDetections[0], prevDetection, gestureThresh);
                    if(hasGestured) {
                        prevGestureTime = currTime;
                        
                        // Update page display as gestured, if possible
                        if(hasGestured > 0 && currPage > 1) {
                            currPage--;
                            pdf.getPage(currPage).then(function(page) {
                                renderPage(page);
                            });
                        }
                        else if(hasGestured < 0 && currPage < numPages){
                            currPage++;
                            pdf.getPage(currPage).then(function(page) {
                                renderPage(page);
                            });
                        }
                    }
                    console.log(hasGestured);
                }
                prevDetection = resizedDetections[0];
            }, 100);
        });

        video.play();

    });

}, false);
