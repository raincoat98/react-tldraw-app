import { StateNode } from "tldraw";

const OFFSET = 12;
export class DateTool extends StateNode {
  static override id = "date";

  override onEnter = () => {
    this.editor.setCursor({ type: "cross", rotation: 0 });
  };

  override onPointerDown = () => {
    const { currentPagePoint } = this.editor.inputs;
    const today = new Date();
    const dateString = today.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    this.editor.createShape({
      type: "text",
      x: currentPagePoint.x - OFFSET,
      y: currentPagePoint.y - OFFSET,
      props: { text: dateString },
    });
  };
}
