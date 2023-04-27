import { createCanvas as cv, loadImage as li } from "@napi-rs/canvas";
export type { Image } from "@napi-rs/canvas";

export const createCanvas = (width: number, height: number) => {
  return cv(width, height);
};

export const loadImage = li;
