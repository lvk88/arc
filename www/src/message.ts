import { MeshOptions } from "emarclib-types";

export type MeshInputPayload = {
  imageData: ImageData;
  mesh_size_min: number,
  mesh_size_factor: number,
  mesh_algorithm: number
};

export type Point2D = {
  x: number,
  y: number
};

export type Edge2D = {
  p0: Point2D,
  p1: Point2D
};

export type CopyableEdgeMesh = {
  edgeSoup: Array<Edge2D>
};

export interface Message {
  message: string,
  payload: MeshInputPayload | CopyableEdgeMesh;
};
