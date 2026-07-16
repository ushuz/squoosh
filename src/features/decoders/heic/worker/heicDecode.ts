/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { blobToArrayBuffer } from 'features/worker-utils';

let libheifModule: Promise<typeof import('libheif-js/wasm-bundle').default>;

export default async function decode(blob: Blob): Promise<ImageData> {
  if (!libheifModule) {
    libheifModule = import('libheif-js/wasm-bundle').then((m) => m.default);
  }

  const [libheif, data] = await Promise.all([
    libheifModule,
    blobToArrayBuffer(blob),
  ]);

  const decoder = new libheif.HeifDecoder();
  const images = decoder.decode(new Uint8Array(data));
  if (!images || images.length === 0) throw new Error('Decoding error');

  // A HEIC file can contain multiple images; decode the primary (first) one.
  const image = images[0];
  const width = image.get_width();
  const height = image.get_height();
  const imageData = new ImageData(width, height);

  await new Promise<void>((resolve, reject) => {
    image.display(imageData, (displayData) => {
      if (!displayData) {
        reject(new Error('HEIF processing error'));
        return;
      }
      resolve();
    });
  });

  return imageData;
}
