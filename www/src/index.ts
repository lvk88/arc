import { Message, MeshInputPayload, CopyableEdgeMesh } from "./message";
import './styles.css';
import { SVG } from "@svgdotjs/svg.js";

const fileUpload = <HTMLInputElement>document.getElementById("image-upload");
const meshButton = <HTMLButtonElement>document.getElementById("mesh-btn");
const removeBgButton = <HTMLButtonElement>document.getElementById("remove-bg-btn");
const resetButton = <HTMLButtonElement>document.getElementById("reset-btn");
const exportButton = <HTMLButtonElement>document.getElementById("export-btn");
const canvasContainer = <HTMLDivElement>document.getElementById("canvasContainer");
const canvas = <HTMLCanvasElement>document.getElementById("postproc-area");
const ctx = canvas.getContext("2d");
const imageDropArea = <HTMLDivElement>document.getElementById("imageDropArea");
let svgString: string = null;
var imageData: ImageData = null;


// Set up image drop area
["dragenter", "dragover"].forEach(eventName => {
  imageDropArea.addEventListener(eventName, (ev: Event) => {
    imageDropArea.classList.add("highlight")
    ev.preventDefault();
  }, false);
});

["dragleave"].forEach(eventName => {
  imageDropArea.addEventListener(eventName, (ev) => {
    imageDropArea.classList.remove("highlight");
    ev.preventDefault();
  });
});

imageDropArea.addEventListener('drop', (ev: DragEvent) => {
  imageDropArea.classList.remove("highlight");
  ev.preventDefault();
  const dt = ev.dataTransfer;
  const files = dt.files;
  const file = files[0];
  if(!file.type.includes('image')){
    console.log("Got file which is not image, skipping...");
  }
  onNewImage(file);
});

imageDropArea.addEventListener('click', (ev: MouseEvent) => {
 fileUpload.click();
});

const gmshWorker = new Worker(
  // @ts-ignore
  new URL('./gmshworker.ts', import.meta.url)
);

gmshWorker.addEventListener("message", (ev: MessageEvent<Message>) => {
  logger_callback("[gmshWorker]" + ev.data.message.toString());
  if(ev.data.message == "gmshReady"){
    fileUpload.disabled = false;
  }
  else if(ev.data.message == "path2DReady"){
    ctx.lineWidth = 0.5;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const copyableEdgeMesh = ev.data.payload as CopyableEdgeMesh;

    svgString = copyableEdgeMesh.svgString;

    const path = new Path2D(svgString);

    ctx.stroke(path);
    meshButton.disabled = false;
    removeBgButton.disabled = false;
  }
});

const u2netWorker = new Worker(
  // @ts-ignore
  new URL('./u2networker.ts', import.meta.url)
);

u2netWorker.addEventListener("message", (ev: MessageEvent<Message>) => {
  logger_callback("[u2netWorker]" + ev.data.message);
  if (ev.data.message == "maskReady") {
    const bitmap = createImageBitmap(ev.data.payload as ImageData).then((bitmap) => {
      ctx.drawImage(bitmap, 0, 0);
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      meshButton.disabled = false;
      removeBgButton.disabled = false;
    });
  }
});

const logger_callback = (message: string) => {
  const log_container = <HTMLDivElement>document.getElementById("log-container");
  const logEntry = document.createElement("div");
  logEntry.className = 'log-entry';
  logEntry.textContent = message;
  log_container.appendChild(logEntry);
  log_container.scrollTop = log_container.scrollHeight;
}

const onNewImage = (file: File) => {
  const image = new Image();
  image.src = URL.createObjectURL(file);
  image.onload = () => {
    createImageBitmap(image)
    .then( (imageBitmap) => {
      // Compute aspect ratio
      let aspectRatio = imageBitmap.width / imageBitmap.height;
      let targetHeight = canvasContainer.clientHeight;
      let targetWidth = canvasContainer.clientWidth;
      let targetCanvasSize = 400;
      let rescaledWidth = imageBitmap.width;
      let rescaledHeight = imageBitmap.height;
      let canvasWidth = 400;
      let canvasHeight = 400;

      // Find which one is the longer side
      if(imageBitmap.width > imageBitmap.height){
        rescaledWidth = targetWidth;
        rescaledHeight = Math.round(rescaledWidth / aspectRatio);
        canvasWidth = targetCanvasSize;
        canvasHeight = Math.round(canvasWidth / aspectRatio);
      } else {
        rescaledHeight = targetHeight;
        rescaledWidth = Math.round(rescaledHeight * aspectRatio);
        canvasHeight = targetCanvasSize;
        canvasWidth = Math.round(canvasHeight * aspectRatio);
      }

      canvas.style.width = rescaledWidth.toString() + "px";
      canvas.style.height = rescaledHeight.toString() + "px";

      // The width and height of the canvas should be 
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      ctx.drawImage(imageBitmap, 0, 0, canvasWidth, canvasHeight);
      imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      canvas.style.visibility = "visible";
      imageDropArea.style.visibility = "hidden";
    } )
    .then( () => {
      meshButton.disabled = false;
      removeBgButton.disabled = false;
    }  );
  }
};

fileUpload.addEventListener("change", (e: Event) => {
  const files = fileUpload.files;
  if(files.length == 0) return;
  const file = files[0];
  onNewImage(file);
});

meshButton.addEventListener("click", (ev: MouseEvent) => {
  const mesh_size_factor = parseFloat((<HTMLInputElement>document.getElementById("mesh-length-factor")).value);
  const algorithm = parseInt((<HTMLSelectElement>document.getElementById("mesh-algorithm")).value);
  gmshWorker.postMessage({
      message: "generateMesh",
      payload: {
        imageData: imageData,
        mesh_size_min: 0.0,
        mesh_size_factor: mesh_size_factor,
        mesh_algorithm: algorithm
      }});
  meshButton.disabled = true;
  removeBgButton.disabled = true;
});

removeBgButton.addEventListener("click", (ev) => {
  u2netWorker.postMessage({
    message: "removeBackground",
    payload: imageData
  });
  meshButton.disabled = true;
  removeBgButton.disabled = true;
});

resetButton.addEventListener("click", (ev: MouseEvent) => {
  meshButton.disabled = true;
  removeBgButton.disabled = true;
  imageData = null;
  svgString = null;
  canvas.style.visibility = "hidden";
  imageDropArea.style.visibility = "visible";
});

exportButton.addEventListener("click", (ev: MouseEvent) =>{
  if(svgString == null){
    return;
  }

  let svg = SVG();
  svg.size(canvas.width, canvas.height);
  svg.path(svgString).fill('none').stroke({color: '#000', width: 0.5});
  const file = svg.svg();
  const blob = new Blob([file], { type: "image/svg+xml"});
  const link = document.createElement("a");
  link.download = "mesh.svg";
  link.href = URL.createObjectURL(blob);
  link.click();
});