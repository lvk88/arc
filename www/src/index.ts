import Module from "emarclib";
import { MainModule } from "emarclib-types";

const canvas = <HTMLCanvasElement>document.getElementById("postproc-area");
const ctx = canvas.getContext("2d");

const readBufferData = (buffer: Uint8Array) => {
  const magicNumber = buffer[0];
  const width = new DataView(buffer.buffer).getUint32(1, true);
  const height = new DataView(buffer.buffer).getUint32(5, true);

  const pixelData = buffer.slice(9);

  console.log(magicNumber);
  console.log(width);
  console.log(height);
  console.log(pixelData);
  return {
    width,
    height,
    pixelData
  };
};

const main = async () => {
  const m: MainModule = await Module();
  const f = await fetch("out.lvk88");
  const buffer = new Uint8Array(await f.arrayBuffer());
  const data = readBufferData(buffer);

  const img = new m.SizedSingleChannelImage(data.width, data.height, data.pixelData);

  const res = m.mesh_image(img);

  // Note: I keep getting OOM errors if I try to
  // use nodeCoordinates through res, e.g.:
  // const x = res.nodeCoordinates.get(i)
  const nodeCoordinates = res.nodeCoordinates;
  const edgeNodes = res.edgeNodes;
  ctx.lineWidth = 0.5;
  ctx.scale(2.0, 2.0);

  const path = new Path2D();

  for(var i = 0; i < edgeNodes.size(); i += 2){
    const node_0 = edgeNodes.get(i);
    const node_1 = edgeNodes.get(i + 1);

    const x_0 = nodeCoordinates.get(3 * node_0);
    const y_0 = nodeCoordinates.get(3 * node_0 + 1);

    path.moveTo(x_0, 200 - y_0);

    const x_1 = nodeCoordinates.get(3 * node_1);
    const y_1 = nodeCoordinates.get(3 * node_1 + 1);

    path.lineTo(x_1, 200 - y_1);
  }
  ctx.stroke(path);
  edgeNodes.delete();
  nodeCoordinates.delete();
  res.delete();
}

main();
