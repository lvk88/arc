import Module from "emarclib";
import { MainModule, EdgeMesh } from "emarclib-types";

const fileUpload = <HTMLInputElement>document.getElementById("image-upload");
const canvas = <HTMLCanvasElement>document.getElementById("postproc-area");
const ctx = canvas.getContext("2d");

const m : MainModule = await Module().then((module: MainModule) => {
  fileUpload.disabled = false;
  return module;
});

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


fileUpload.addEventListener("change",(e: Event) => {
  const files = fileUpload.files;
  if(files.length == 0) return;
  const file = files[0];

  const image = new Image();
  image.src = URL.createObjectURL(file);
  image.onload = () => {
    createImageBitmap(image)
    .then( async (imageBitmap) => {
      ctx.drawImage(imageBitmap, 0, 0, 400, 400);
      const grayScaleBuffer = new Uint8Array(400 * 400);
      const imgPixels = ctx.getImageData(0, 0, 400, 400);
      for(var i = 0; i < imgPixels.width; ++i){
        for(var j = 0; j < imgPixels.height; ++j){
          var value = 0.299 * imgPixels.data[4 * i + 4 * j * imgPixels.width];
          value += 0.587 * imgPixels.data[4 * i + 1 + 4 * j * imgPixels.width];
          value += 0.114 * imgPixels.data[4 * i + 2 + 4 * j * imgPixels.width];
          grayScaleBuffer[i + j * 400] = value;
        }
      }
      const sizedSingleChannelImage = new m.SizedSingleChannelImage(400, 400, grayScaleBuffer);
      const mesh = m.mesh_image(sizedSingleChannelImage);
      return mesh;
    })
    .then(renderMesh);
  }
})
