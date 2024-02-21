const fs = require('fs');

async function main() {
  const module = await require("./emarclib")();
  try {
    const buffer = fs.readFileSync('out.lvk88')

    const magicNumber = buffer.readUint8(0);
    console.log("Read magic number ", magicNumber);

    const width = buffer.readInt32LE(1);
    const height = buffer.readInt32LE(5);
    console.log("w x h: ", width, " x " , height);

    const pixelData = buffer.slice(9);
    const pixelArray = Uint8Array.from(pixelData);
    console.log(pixelArray)

    console.log("Value of first pixel: ", pixelArray[0]);

    const img = new module.SizedSingleChannelImage(width, height, pixelArray);

    module.mesh_image(img)

    img.delete()

  } catch (error) {
    console.log('Error readin file: ', error);
  }
}

main();
