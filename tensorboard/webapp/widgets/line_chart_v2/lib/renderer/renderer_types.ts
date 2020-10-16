import {Paths, Rect} from '../types';

export interface IRenderer {
  /**
   * Certain renderer requires DOM dimensions for correct density and operations. The
   * method is invoked when container is resized.
   *
   * @param domRect Container dimensions
   */
  onResize(domRect: Rect): void;

  drawLine(cacheId: string, paths: Paths, spec: LineSpec): void;

  flush(): void;

  renderGroup(groupName: string, renderBlock: () => void): void;
}

export interface LineSpec {
  visible: boolean;
  color: string;
  opacity?: number;
  width: number;
  clipRect?: Rect;
}
