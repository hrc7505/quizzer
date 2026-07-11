declare module "@thednp/dommatrix" {
  const DOMMatrixShim: typeof DOMMatrix;
  export default DOMMatrixShim;
}

declare module "path2d" {
  export class Path2D extends globalThis.Path2D {
    constructor(path?: Path2D | string);
  }
}

declare module "@canvas/image-data" {
  const ImageDataShim: typeof ImageData;
  export default ImageDataShim;
}
