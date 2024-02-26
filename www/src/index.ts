import Module from "emarclib";
import { MainModule } from "emarclib-types";

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
}

main();
