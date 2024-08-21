import { useEffect, useState } from "react";
import { AssetRecordType, Editor, Tldraw, track, useEditor } from "tldraw";
import "./custom-ui.css";

const extendSelectTool = (editor: Editor) => {
  const DOUBLE_TAP_DELAY = 300;
  let lastTouchEndTime = 0;

  const changeSelectToolState = () => {
    const isSelectTool = editor.getCurrentToolId() === "select";
    if (isSelectTool) {
      editor.setCurrentTool("select.idle");
    }
  };

  // Handlers
  const handleDoubleClick = (event: MouseEvent) => {
    event.preventDefault();
    changeSelectToolState();
  };

  const handleTouchEnd = (event: TouchEvent) => {
    const now = Date.now();
    if (now - lastTouchEndTime <= DOUBLE_TAP_DELAY) {
      event.preventDefault();
      changeSelectToolState();
    }
    lastTouchEndTime = now;
  };

  window.addEventListener("dblclick", handleDoubleClick);
  window.addEventListener("touchend", handleTouchEnd);

  // Cleanup function
  return () => {
    window.removeEventListener("dblclick", handleDoubleClick);
    window.removeEventListener("touchend", handleTouchEnd);
  };
};

function handleClear(editor: Editor) {
  const shapeIds = editor.getCurrentPageShapeIds();

  if (!shapeIds) return;

  for (const shapeId of shapeIds) {
    editor.deleteShape(shapeId);
  }

  if (!editor.getAssets()) return;
  editor.deleteAssets(editor.getAssets());
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

export default function App() {
  const [editor, setEditor] = useState<Editor | null>(null);

  useEffect(() => {
    if (editor) {
      // 더블클릭시 select 모드 변경 하지 않기
      extendSelectTool(editor);
    }
  }, [editor]);

  const handleUploadImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !editor) return;

      const assetId = AssetRecordType.createId();
      const reader = new FileReader();

      reader.onload = () => {
        const image = new Image();
        image.src = reader.result as string;
        image.onload = () => {
          const imageWidth = image.width;
          const imageHeight = image.height;

          editor.createAssets([
            {
              id: assetId,
              type: "image",
              typeName: "asset",
              props: {
                name: file.name,
                src: reader.result as string,
                w: imageWidth,
                h: imageHeight,
                mimeType: file.type,
                isAnimated: false,
              },
              meta: {},
            },
          ]);
          editor.createShape({
            type: "image",
            x: (window.innerWidth - imageWidth) / 2,
            y: (window.innerHeight - imageHeight) / 2,
            isLocked: true,
            props: {
              assetId,
              w: imageWidth,
              h: imageHeight,
            },
          });
        };
      };
      reader.readAsDataURL(file);
    };

    input.click();
  };

  return (
    <>
      <div style={{ position: "fixed", inset: 0 }}>
        <Tldraw onMount={(editor) => setEditor(editor)} inferDarkMode>
          <CustomUi handleUploadImage={handleUploadImage} />
        </Tldraw>
      </div>
    </>
  );
}

const CustomUi = track(({ handleUploadImage }) => {
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
        <button className="custom-button" onClick={handleUploadImage}>
          업로드
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
