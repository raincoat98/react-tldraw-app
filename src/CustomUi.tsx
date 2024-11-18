import { useEffect } from "react";
import { track, useEditor, Editor } from "tldraw";
import BackHandIcon from "@mui/icons-material/BackHand";
import NearMeIcon from "@mui/icons-material/NearMe";
import CreateIcon from "@mui/icons-material/Create";
import DateRangeIcon from "@mui/icons-material/DateRange";
import FontDownloadIcon from "@mui/icons-material/FontDownload";
import FavoriteIcon from "@mui/icons-material/Favorite";
import RedoIcon from "@mui/icons-material/Redo";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEraser } from "@fortawesome/free-solid-svg-icons";
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

function handleToggle() {
  const stylePanel = document.querySelector(
    ".tlui-style-panel__wrapper"
  ) as HTMLElement;
  if (stylePanel) {
    stylePanel.style.display =
      stylePanel.style.display === "none" ? "block" : "none";
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
          data-isactive={editor.getCurrentToolId() === "hand"}
          onClick={() => editor.setCurrentTool("hand")}
          style={{ height: "40px" }}
        >
          <BackHandIcon />
        </button>
        <button
          className="custom-button"
          data-isactive={editor.getCurrentToolId() === "select"}
          onClick={() => editor.setCurrentTool("select")}
          style={{ height: "40px" }}
        >
          <NearMeIcon />
        </button>
        <button
          className="custom-button"
          data-isactive={editor.getCurrentToolId() === "draw"}
          onClick={() => editor.setCurrentTool("draw")}
          style={{ height: "40px" }}
        >
          <CreateIcon />
        </button>
        <button
          className="custom-button"
          data-isactive={editor.getCurrentToolId() === "eraser"}
          onClick={() => editor.setCurrentTool("eraser")}
          style={{ height: "40px" }}
        >
          <FontAwesomeIcon icon={faEraser} size="lg" />
        </button>
        <button
          className="custom-button"
          data-isactive={editor.getCurrentToolId() === "text"}
          onClick={() => editor.setCurrentTool("text")}
          style={{ height: "40px" }}
        >
          <FontDownloadIcon />
        </button>
        <button
          className="custom-button"
          onClick={() => handleToggle()}
          style={{ height: "40px" }}
        >
          <ColorLensIcon />
        </button>
        <button
          className="custom-button"
          data-isactive={editor.getCurrentToolId() === "date"}
          onClick={() => editor.setCurrentTool("date")}
          style={{ height: "40px" }}
        >
          <DateRangeIcon />
        </button>
        <button
          className="custom-button"
          data-isactive={editor.getCurrentToolId() === "sticker"}
          onClick={() => editor.setCurrentTool("sticker")}
          style={{ height: "40px" }}
        >
          <FavoriteIcon />
        </button>
        <button
          className="custom-button"
          onClick={() => handleClear(editor)}
          style={{ height: "40px" }}
        >
          <RedoIcon />
        </button>
        <button
          className="custom-button"
          onClick={() => handleZoomOut(editor)}
          style={{ height: "40px" }}
        >
          <RemoveIcon />
        </button>
        <button
          className="custom-button"
          onClick={() => handleZoomIn(editor)}
          style={{ height: "40px" }}
        >
          <AddIcon />
        </button>
      </div>
    </div>
  );
});
