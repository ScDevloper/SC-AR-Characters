declare module "@ar-js-org/ar.js/three.js/build/ar-threex.mjs" {
  import type * as THREE from "three";

  export class ArToolkitSource {
    constructor(parameters: Record<string, unknown>);
    ready: boolean;
    domElement: HTMLVideoElement;
    init(onReady: () => void, onError?: (error: unknown) => void): void;
    onResizeElement(): void;
    copyElementSizeTo(element: HTMLElement): void;
    dispose(): void;
  }

  export class ArToolkitContext {
    constructor(parameters: Record<string, unknown>);
    arController?: { canvas: HTMLCanvasElement };
    init(onCompleted: () => void): void;
    update(source: HTMLVideoElement): void;
    getProjectionMatrix(): THREE.Matrix4;
  }

  export class ArMarkerControls {
    constructor(
      context: ArToolkitContext,
      object3d: THREE.Object3D,
      parameters: Record<string, unknown>,
    );
  }

  export class ArSmoothedControls {
    constructor(object3d: THREE.Object3D, parameters: Record<string, unknown>);
    update(object3d: THREE.Object3D): void;
  }
}
