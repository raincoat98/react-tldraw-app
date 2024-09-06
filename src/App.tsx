import { useState } from "react";
import { PdfEditor } from "./PdfEditor";
import { Pdf, PdfPicker, PdfPage } from "./PdfPicker";
import "./pdf-editor.css";

type State =
  | {
      phase: "pick";
    }
  | {
      phase: "edit";
      pdf: Pdf;
    }
  | {
      phase: "edit-image";
      image: PdfPage;
    };

export default function PdfEditorWrapper() {
  const [state, setState] = useState<State>({ phase: "pick" });

  switch (state.phase) {
    case "pick":
      return (
        <div className="PdfEditor">
          <PdfPicker
            onOpenPdf={(pdf) => setState({ phase: "edit", pdf })}
            onOpenImage={(image) => setState({ phase: "edit-image", image })}
          />
        </div>
      );
    case "edit":
      return (
        <div className="PdfEditor">
          <PdfEditor pdf={state.pdf} />
        </div>
      );
    case "edit-image":
      return (
        <div className="PdfEditor">
          <PdfEditor image={state.image} />
        </div>
      );
  }
}
