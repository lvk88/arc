import * as ort from 'onnxruntime-web';
import { Message } from './message';

addEventListener("message", async (ev: MessageEvent<Message>)  => {
    if(ev.data.message == "removeBackground"){
        const session = await ort.InferenceSession.create("./u2netp.onnx");
        const inputImage = ev.data.payload as ImageData;

        // Resize input image to 320 x 320
        var offscreenCanvas = new OffscreenCanvas(320, 320);
        var offsreenContext = offscreenCanvas.getContext("2d");
        const imageBitmap = await createImageBitmap(inputImage);
        offsreenContext.drawImage(imageBitmap, 0, 0, 320, 320);
        var resizedInputImage = offsreenContext.getImageData(0, 0, 320, 320);

        const inputTensorArray = new Float32Array(3 * 320 * 320);
        // Create a 1 x 3 x 320 x 320 tensor with normalized data
        for(let i = 0; i < resizedInputImage.height; ++i){
            for(let j = 0; j < resizedInputImage.width; ++j){
                let r = (resizedInputImage.data[4 * j + 4 * i * resizedInputImage.width] / 255. - 0.485) / 0.229;
                let g = (resizedInputImage.data[4 * j + 4 * i * resizedInputImage.width + 1] / 255. - 0.456) / 0.224;
                let b = (resizedInputImage.data[4 * j + 4 * i * resizedInputImage.width + 2] / 255. - 0.406) / 0.225;

                inputTensorArray[j + i * 320 + 0 * 320 * 320] = r
                inputTensorArray[j + i * 320 + 1 * 320 * 320] = g
                inputTensorArray[j + i * 320 + 2 * 320 * 320] = b
            }
        }

        const inputTensor = new ort.Tensor(inputTensorArray, [1,3,320,320]);
        const inputName = session.inputNames[0];
        const outputName = session.outputNames[0];

        // Computed property name
        const input = {[inputName]: inputTensor};

        const result = await session.run(input, [outputName]);
        const mask = result[1959].data as Float32Array;

        const maskImage = new ImageData(320, 320);
        for (let i = 0; i < 320; ++i) {
            for (let j = 0; j < 320; ++j) {
                maskImage.data[4 * i * 320 + 4 * j] = mask[i * 320 + j] * 255;
                maskImage.data[4 * i * 320 + 4 * j + 1] = mask[i * 320 + j] * 255;
                maskImage.data[4 * i * 320 + 4 * j + 2] = mask[i * 320 + j] * 255;
                maskImage.data[4 * i * 320 + 4 * j + 3] = mask[i * 320 + j] * 255;
            }
        }

        const maskBitmap = await createImageBitmap(maskImage);
        offsreenContext.reset();
        offscreenCanvas.width = inputImage.width;
        offscreenCanvas.height = inputImage.height;
        offsreenContext.drawImage(maskBitmap, 0, 0, inputImage.width, inputImage.height);
        const resizedMaskBitmap = offsreenContext.getImageData(0, 0, inputImage.width, inputImage.height);

        for (let i = 0; i < inputImage.height; ++i) {
            for (let j = 0; j < inputImage.width; ++j) {
                if(resizedMaskBitmap.data[4 * i * resizedMaskBitmap.width + 4 * j] < 127){
                    inputImage.data[4 * i * resizedMaskBitmap.width + 4 * j] = 255;
                    inputImage.data[4 * i * resizedMaskBitmap.width + 4 * j + 1] = 255;
                    inputImage.data[4 * i * resizedMaskBitmap.width + 4 * j + 2] = 255;
                }
            }
        }

        postMessage({message: "maskReady", payload: inputImage});

        session.release();
    }
});