import { useEffect } from "react";
import { track, useEditor, Editor } from "tldraw";
import "./custom-ui.css";

function handleClear(editor: Editor) {
  const shapeIds = editor.getCurrentPageShapeIds();
  if (!shapeIds) return;

  for (const shapeId of shapeIds) {
    editor.deleteShape(shapeId);
  }

  // Uncomment if you need to delete assets
  // if (!editor.getAssets()) return;
  // editor.deleteAssets(editor.getAssets());

  const isMobile = editor.getViewportScreenBounds().width < 840;

  const camera = editor.getCamera();
  if (camera) {
    const pageBounds = editor.getCurrentPageBounds();

    if (pageBounds) {
      editor.setCameraOptions({
        constraints: {
          bounds: pageBounds,
          padding: { x: isMobile ? 16 : 164, y: 64 },
          origin: { x: 0.5, y: 0 },
          initialZoom: "fit-x-100",
          baseZoom: "default",
          behavior: "contain",
        },
      });
      editor.setCamera(editor.getCamera(), { reset: true });
    }
  }
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
          data-isactive={editor.getCurrentToolId() === "hand"}
          onClick={() => editor.setCurrentTool("hand")}
        >
          hand
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
        <button
          className="custom-button"
          data-isactive={editor.getCurrentToolId() === "text"}
          onClick={() => editor.setCurrentTool("text")}
        >
          text
        </button>
        <button
          className="custom-button"
          data-isactive={editor.getCurrentToolId() === "date"}
          onClick={() => editor.setCurrentTool("date")}
        >
          date
        </button>
        <button
          className="custom-button"
          data-isactive={editor.getCurrentToolId() === "sticker"}
          onClick={() => editor.setCurrentTool("sticker")}
        >
          sticker
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
