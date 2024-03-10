import Module from "emarclib";
import { MainModule, EdgeMesh } from "emarclib-types";
import { Message, MeshInputPayload, CopyableEdgeMesh } from "./message";

const fileUpload = <HTMLInputElement>document.getElementById("image-upload");
const meshButton = <HTMLButtonElement>document.getElementById("mesh-btn");
const canvas = <HTMLCanvasElement>document.getElementById("postproc-area");
const ctx = canvas.getContext("2d");
var imageData: ImageData = null;

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

    const path = new Path2D();
    copyableEdgeMesh.edgeSoup.forEach((edge) => {
      path.moveTo(edge.p0.x, edge.p0.y);
      path.lineTo(edge.p1.x, edge.p1.y);
    });

    ctx.stroke(path);
  }
});

const m : MainModule = await Module();
//fileUpload.disabled = false;

const logger_callback = (message: string) => {
  const log_container = <HTMLDivElement>document.getElementById("log-container");
  const logEntry = document.createElement("div");
  logEntry.className = 'log-entry';
  logEntry.textContent = message;
  log_container.appendChild(logEntry);
  log_container.scrollTop = log_container.scrollHeight;
}

const renderMesh = async (mesh: EdgeMesh) => {
  // Note: I keep getting OOM errors if I try to
  // use nodeCoordinates through res, e.g.:
  // const x = res.nodeCoordinates.get(i)
  const nodeCoordinates = mesh.nodeCoordinates;
  const edgeNodes = mesh.edgeNodes;
  ctx.lineWidth = 0.5;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const path = new Path2D();

  for(var i = 0; i < edgeNodes.size(); i += 2){
    const node_0 = edgeNodes.get(i);
    const node_1 = edgeNodes.get(i + 1);

    const x_0 = nodeCoordinates.get(3 * node_0);
    const y_0 = nodeCoordinates.get(3 * node_0 + 1);

    path.moveTo(x_0, canvas.height - y_0);

    const x_1 = nodeCoordinates.get(3 * node_1);
    const y_1 = nodeCoordinates.get(3 * node_1 + 1);

    path.lineTo(x_1, canvas.height - y_1);
  }
  ctx.stroke(path);
  edgeNodes.delete();
  nodeCoordinates.delete();
  mesh.delete();
}

fileUpload.addEventListener("change", (e: Event) => {
  const files = fileUpload.files;
  if(files.length == 0) return;
  const file = files[0];
  const image = new Image();
  image.src = URL.createObjectURL(file);
  image.onload = () => {
    createImageBitmap(image)
    .then( (imageBitmap) => {
      // Compute aspect ratio
      let aspectRatio = imageBitmap.width / imageBitmap.height;
      let targetSize = 400;
      let rescaledWidth = imageBitmap.width;
      let rescaledHeight = imageBitmap.height;

      // Find which one is the longer side
      if(imageBitmap.width > imageBitmap.height){
        rescaledWidth = targetSize;
        rescaledHeight = Math.round(rescaledWidth / aspectRatio);
      } else {
        rescaledHeight = targetSize;
        rescaledWidth = Math.round(rescaledHeight * aspectRatio);
      }

      canvas.style.width = rescaledWidth.toString() + "px";
      canvas.style.height = rescaledHeight.toString() + "px";
      canvas.width = rescaledWidth;
      canvas.height = rescaledHeight;
      ctx.drawImage(imageBitmap, 0, 0, rescaledWidth, rescaledHeight);
      imageData = ctx.getImageData(0, 0, rescaledWidth, rescaledHeight);
    } )
    .then( () => meshButton.disabled = false );
  }
});

meshButton.addEventListener("click", (ev: MouseEvent) => {
  const  mesh_size_min = parseFloat((<HTMLInputElement>document.getElementById("mesh-min-length")).value);
  const mesh_size_factor = parseFloat((<HTMLInputElement>document.getElementById("mesh-length-factor")).value);
  const algorithm = parseInt((<HTMLSelectElement>document.getElementById("mesh-algorithm")).value);
  gmshWorker.postMessage({
      message: "generateMesh",
      payload: {
        imageData: imageData,
        mesh_size_min: mesh_size_min,
        mesh_size_factor: mesh_size_factor,
        mesh_algorithm: algorithm
      }});
});
