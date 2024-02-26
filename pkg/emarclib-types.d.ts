export interface SizedSingleChannelImage {
  data: Uint8Vector;
  width: number;
  height: number;
  delete(): void;
}

export interface EdgeMesh {
  nodeCoordinates: DoubleVector;
  edgeNodes: SizeTVector;
  delete(): void;
}

export interface Uint8Vector {
  push_back(_0: number): void;
  resize(_0: number, _1: number): void;
  size(): number;
  set(_0: number, _1: number): boolean;
  get(_0: number): any;
  delete(): void;
}

export interface DoubleVector {
  size(): number;
  push_back(_0: number): void;
  resize(_0: number, _1: number): void;
  set(_0: number, _1: number): boolean;
  get(_0: number): any;
  delete(): void;
}

export interface SizeTVector {
  push_back(_0: number): void;
  resize(_0: number, _1: number): void;
  size(): number;
  set(_0: number, _1: number): boolean;
  get(_0: number): any;
  delete(): void;
}

export interface MainModule {
  SizedSingleChannelImage: {new(): SizedSingleChannelImage; new(_0: number, _1: number, _2: any): SizedSingleChannelImage};
  EdgeMesh: {};
  mesh_image(_0: SizedSingleChannelImage): EdgeMesh;
  Uint8Vector: {new(): Uint8Vector};
  DoubleVector: {new(): DoubleVector};
  SizeTVector: {new(): SizeTVector};
}
