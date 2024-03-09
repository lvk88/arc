import Module from "emarclib";
import { MainModule, EdgeMesh } from "emarclib-types";

const fileUpload = <HTMLInputElement>document.getElementById("image-upload");
const meshButton = <HTMLButtonElement>document.getElementById("mesh-btn");
const canvas = <HTMLCanvasElement>document.getElementById("postproc-area");
const ctx = canvas.getContext("2d");
var imageData: ImageData = null;

const m : MainModule = await Module();
fileUpload.disabled = false;

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
  const grayScaleBuffer = new Uint8Array(imageData.width * imageData.height);
  for(let i = 0; i < imageData.height; ++i){
    for(let j = 0; j < imageData.width; ++j){
      let value = 0.299 * imageData.data[4 * j + 4 * i * imageData.width];
      value += 0.587 * imageData.data[4 * j + 1 + 4 * i * imageData.width];
      value += 0.114 * imageData.data[4 * j + 2 + 4 * i * imageData.width];
      grayScaleBuffer[j + i * canvas.width] = value;
    }
  }
  const sizedSingleChannelImage = new m.SizedSingleChannelImage(canvas.width, canvas.height, grayScaleBuffer);
  const meshOptions = new m.MeshOptions();
  meshOptions.mesh_size_min = parseFloat((<HTMLInputElement>document.getElementById("mesh-min-length")).value);
  meshOptions.mesh_size_factor = parseFloat((<HTMLInputElement>document.getElementById("mesh-length-factor")).value);
  meshOptions.algorithm = parseInt((<HTMLSelectElement>document.getElementById("mesh-algorithm")).value);
  
  const mesh = m.mesh_image(sizedSingleChannelImage, meshOptions);
  meshOptions.delete();
  renderMesh(mesh);
});
