import { useEffect } from "react";
import { track, useEditor, Editor } from "tldraw";
import "./custom-ui.css";

function handleClear(editor: Editor) {
  const shapeIds = editor.getCurrentPageShapeIds();
  if (!shapeIds) return;
  for (const shapeId of shapeIds) {
    editor.deleteShape(shapeId);
  }
  // if (!editor.getAssets()) return;
  // editor.deleteAssets(editor.getAssets());
}
function handleZoomOut(editor: Editor) {
  if (editor.getZoomLevel() > 0.25) {
    editor.zoomOut();
    return;
  }
}
function handleZoomIn(editor: Editor) {
  if (editor.getZoomLevel() < 5) {
    editor.zoomIn();
    return;
  }
}

export const CustomUi = track(() => {
  const editor = useEditor();
  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Delete":
        case "Backspace": {
          editor.deleteShapes(editor.getSelectedShapeIds());
          break;
        }
        case "v": {
          editor.setCurrentTool("select");
          break;
        }
        case "e": {
          editor.setCurrentTool("eraser");
          break;
        }
        case "x":
        case "p":
        case "b":
        case "d": {
          editor.setCurrentTool("draw");
          break;
        }
      }
    };
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keyup", handleKeyUp);
    };
  });
  return (
    <div className="custom-layout">
      <div className="custom-toolbar">
        <button
          className="custom-button"
          data-isactive={editor.getCurrentToolId() === "select"}
          onClick={() => editor.setCurrentTool("select")}
        >
          Select
        </button>
        <button
          className="custom-button"
          data-isactive={editor.getCurrentToolId() === "draw"}
          onClick={() => editor.setCurrentTool("draw")}
        >
          Pencil
        </button>
        <button
          className="custom-button"
          data-isactive={editor.getCurrentToolId() === "eraser"}
          onClick={() => editor.setCurrentTool("eraser")}
        >
          Eraser
        </button>
        <button className="custom-button" onClick={() => handleClear(editor)}>
          초기화
        </button>
        <button className="custom-button" onClick={() => handleZoomOut(editor)}>
          축소
        </button>
        <button className="custom-button" onClick={() => handleZoomIn(editor)}>
          확대
        </button>
      </div>
    </div>
  );
});
