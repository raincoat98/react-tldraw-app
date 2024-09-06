import { useState } from "react";
import { Editor, exportToBlob, useEditor } from "tldraw";
import { PdfPage } from "./PdfPicker";

export function ExportImageButton({ image }: { image: PdfPage }) {
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const editor = useEditor();

  const handleExport = async () => {
    if (!editor) {
      console.error("Editor is not initialized.");
      return;
    }

    setExportProgress(0);
    try {
      await exportImage(editor, image, setExportProgress);
    } catch (error) {
      console.error("Error exporting image:", error);
      alert("Failed to export image. Please try again.");
    } finally {
      setExportProgress(null);
    }
  };

  return (
    <button className="ExportImageButton" onClick={handleExport}>
      {exportProgress
        ? `Exporting... ${Math.round(exportProgress * 100)}%`
        : "Export Image"}
    </button>
  );
}

async function exportImage(
  editor: Editor,
  image: PdfPage,
  onProgress: (progress: number) => void
) {
  const totalSteps = 3;
  let progressCount = 0;

  const tickProgress = () => {
    progressCount++;
    onProgress(progressCount / totalSteps);
  };

  // Filter all shapes within the image's bounds
  const allIds = Array.from(editor.getCurrentPageShapeIds());
  const shapesInBounds = allIds.filter((id) => {
    const shapePageBounds = editor.getShapePageBounds(id);
    if (!shapePageBounds) return false;
    return shapePageBounds.collides(image.bounds);
  });

  if (shapesInBounds.length === 0) {
    alert("No shapes found within the specified image bounds.");
    return;
  }

  tickProgress();

  try {
    // Export the selected area to a blob (PNG format)
    const exportedBlob = await exportToBlob({
      editor,
      ids: shapesInBounds,
      format: "png",
      opts: { background: true, bounds: image.bounds, padding: 0, scale: 2 },
    });

    tickProgress();

    // Create a download link for the image
    const url = URL.createObjectURL(exportedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${image.shapeId}.png`; // Corrected quote
    a.click();
    URL.revokeObjectURL(url);

    tickProgress();
  } catch (error) {
    console.error("Error during export:", error);
  }
}
