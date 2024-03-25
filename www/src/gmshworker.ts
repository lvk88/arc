import Module from "emarclib";
import { MainModule, EdgeMesh, MeshOptions } from "emarclib-types";
import { Message, MeshInputPayload, CopyableEdgeMesh, Point2D, Edge2D} from "./message";

const m : MainModule = await Module();
postMessage({message: "gmshReady", payload: null});

const logger_callback = (message: string) => {
  postMessage({message: message, payload: null});
}

const resizeForMeshing = async (imageData: ImageData) => {
  const targetSize = 400;
  const aspectRatio = imageData.width / imageData.height;
  let resizedWidth = imageData.width;
  let resizedHeight = imageData.height;
  if(imageData.width > imageData.height){
    resizedWidth = targetSize;
    resizedHeight = Math.round(resizedWidth / aspectRatio);
  } else {
    resizedHeight = targetSize;
    resizedWidth = Math.round(aspectRatio * resizedHeight);
  }

  const imageBitmap = await createImageBitmap(imageData);

  const offscreenCanvas = new OffscreenCanvas(resizedWidth, resizedHeight);
  const offscreenContext = offscreenCanvas.getContext("2d");
  offscreenContext.drawImage(imageBitmap, 0, 0, resizedWidth, resizedHeight);
  const resizedImage = offscreenContext.getImageData(0, 0, resizedWidth, resizedHeight);

  let scaleFactor = imageData.width / resizedImage.width;

  return {scaleFactor: scaleFactor, resizedImage: resizedImage};
};

const createCopyableEdgeMesh = (mesh: EdgeMesh, height: number, scaleFactor: number) => {
  // Note: I keep getting OOM errors if I try to
  // use nodeCoordinates through res, e.g.:
  // const x = res.nodeCoordinates.get(i)
  const nodeCoordinates = mesh.nodeCoordinates;
  const edgeNodes = mesh.edgeNodes;

  const resultEdgeSoup = new Array<Edge2D>();

  let svgString = "";

  for(var i = 0; i < edgeNodes.size(); i += 2){
    const node_0 = edgeNodes.get(i);
    const node_1 = edgeNodes.get(i + 1);

    const x_0 = nodeCoordinates.get(3 * node_0);
    const y_0 = nodeCoordinates.get(3 * node_0 + 1);

    const p0 = {x: x_0 * scaleFactor, y: (height - y_0) * scaleFactor};

    const x_1 = nodeCoordinates.get(3 * node_1);
    const y_1 = nodeCoordinates.get(3 * node_1 + 1);

    const p1 = {x: x_1 * scaleFactor, y: (height - y_1) * scaleFactor};

    resultEdgeSoup.push({p0: p0, p1: p1});
    svgString += "M" + p0.x.toString() + " " + p0.y.toString() + " " + "L" + p1.x.toString() + " " + p1.y.toString();
  }
  edgeNodes.delete();
  nodeCoordinates.delete();
  mesh.delete();
  return {edgeSoup: resultEdgeSoup, svgString: svgString};
}

const meshThenCreatePath2D = async (meshInput: MeshInputPayload) => {
  const resizedImage = await resizeForMeshing(meshInput.imageData);
  const imageData = resizedImage.resizedImage;
  const grayScaleBuffer = new Uint8Array(imageData.width * imageData.height);
  for(let i = 0; i < imageData.height; ++i){
    for(let j = 0; j < imageData.width; ++j){
      let value = 255;
      if(imageData.data[4 * j + 4 * i * imageData.width + 3] > 127){
        value = 0.299 * imageData.data[4 * j + 4 * i * imageData.width];
        value += 0.587 * imageData.data[4 * j + 1 + 4 * i * imageData.width];
        value += 0.114 * imageData.data[4 * j + 2 + 4 * i * imageData.width];
      }
      grayScaleBuffer[j + i * imageData.width] = value;
    }
  }
  const sizedSingleChannelImage = new m.SizedSingleChannelImage(imageData.width, imageData.height, grayScaleBuffer);

  const meshOptions = new m.MeshOptions();
  meshOptions.mesh_size_min = meshInput.mesh_size_min;
  meshOptions.mesh_size_factor = meshInput.mesh_size_factor;
  meshOptions.algorithm = meshInput.mesh_algorithm;

  const mesh = m.mesh_image(sizedSingleChannelImage, meshOptions, logger_callback);
  meshOptions.delete();
  const copyableEdgeMesh = createCopyableEdgeMesh(mesh, imageData.height, resizedImage.scaleFactor);
  postMessage({message: "path2DReady", payload: copyableEdgeMesh});
};

addEventListener("message", (ev: MessageEvent<Message>) => {
  if(ev.data.message == "generateMesh"){
    meshThenCreatePath2D(ev.data.payload as MeshInputPayload);
  }
});
