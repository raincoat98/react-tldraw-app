import { useMemo, useEffect, useState } from "react";
import {
  Box,
  SVGContainer,
  TLComponents,
  TLImageShape,
  TLShapePartial,
  Tldraw,
  getIndicesBetween,
  react,
  sortByIndex,
  track,
  useEditor,
  Editor,
  DefaultKeyboardShortcutsDialog,
  DefaultKeyboardShortcutsDialogContent,
  TldrawUiMenuItem,
  useTools,
  TLUiOverrides,
  TLParentId,
} from "tldraw";
import { ExportPdfButton } from "./ExportPdfButton";
import { ExportImageButton } from "./ExportImageButton";
import { CustomUi } from "./CustomUi";
import { Pdf, PdfPage } from "./PdfPicker";
import { StickerTool } from "./sticker-tool-util";
import { DateTool } from "./date-tool-util";

const uiOverrides: TLUiOverrides = {
  tools(editor, tools) {
    tools.sticker = {
      id: "sticker",
      icon: "heart-icon",
      label: "Sticker",
      kbd: "s",
      onSelect: () => {
        editor.setCurrentTool("sticker");
      },
    };
    tools.date = {
      id: "date",
      icon: "calendar-icon",
      label: "Date",
      kbd: "d",
      onSelect: () => {
        editor.setCurrentTool("date");
      },
    };
    return tools;
  },
};

const extendSelectTool = (editor: Editor) => {
  const DOUBLE_TAP_DELAY = 300;
  let lastTouchEndTime = 0;
  const changeSelectToolState = () => {
    const isSelectTool = editor.getCurrentToolId() === "select";
    if (isSelectTool) {
      editor.setCurrentTool("select.idle");
    }
  };
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
  return () => {
    window.removeEventListener("dblclick", handleDoubleClick);
    window.removeEventListener("touchend", handleTouchEnd);
  };
};

const customTools = [StickerTool, DateTool];

const ImageListPanel = track(() => {
  return (
    <div
      className="image-list-panel"
      style={{
        width: "100%",
        height: "300px",
        backgroundColor: "white",
        boxShadow: "0px -2px 10px rgba(0, 0, 0, 0.1)",
        padding: "20px",
        overflowY: "auto",
      }}
    >
      <h3>이미지 리스트</h3>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {/* 여기에 이미지 리스트를 추가하세요 */}
        <div className="image-item">이미지 1</div>
        <div className="image-item">이미지 2</div>
        <div className="image-item">이미지 3</div>
      </div>
    </div>
  );
});

const BottomButton = track(() => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50px",
          transform: "translateX(-50%)",
          zIndex: 1000,
        }}
      >
        <button className="custom-button" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? "패널 닫기" : "이미지 선택"}
        </button>
      </div>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          transition: "transform 0.3s ease-in-out",
          transform: `translateY(${isOpen ? "0" : "100%"})`,
        }}
      >
        <ImageListPanel />
      </div>
    </>
  );
});

export function PdfEditor({ pdf, image }: { pdf?: Pdf; image?: PdfPage }) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);

  useEffect(() => {
    if (pdf) {
      setPages(pdf.pages);
    } else if (image) {
      // Convert the blob URL to a data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPages([{ ...image, src: dataUrl }]);
      };
      fetch(image.src)
        .then((res) => res.blob())
        .then((blob) => reader.readAsDataURL(blob));
    }
  }, [pdf, image]);

  useEffect(() => {
    if (editor) {
      // 더블클릭시 select 모드 변경 하지 않기
      extendSelectTool(editor);
    }
  }, [editor]);

  const components = useMemo<TLComponents>(
    () => ({
      PageMenu: null,
      ActionsMenu: null,
      HelpMenu: null,
      ZoomMenu: null,
      MainMenu: null,
      Minimap: null,
      // StylePanel: null,
      // NavigationPanel: null,
      Toolbar: null,
      // Toolbar: (props) => {
      //   const tools = useTools();
      //   const isStickerSelected = useIsToolSelected(tools["sticker"]);
      //   return (
      //     <DefaultToolbar {...props}>
      //       <TldrawUiMenuItem
      //         {...tools["sticker"]}
      //         isSelected={isStickerSelected}
      //       />
      //       <DefaultToolbarContent />
      //     </DefaultToolbar>
      //   );
      // },
      KeyboardShortcutsDialog: (props) => {
        const tools = useTools();
        return (
          <DefaultKeyboardShortcutsDialog {...props}>
            <DefaultKeyboardShortcutsDialogContent />
            <TldrawUiMenuItem {...tools["sticker"]} />
          </DefaultKeyboardShortcutsDialog>
        );
      },
      QuickActions: null,
      HelperButtons: null,
      DebugPanel: null,
      DebugMenu: null,
      CursorChatBubble: null,
      TopPanel: () => <CustomUi />,
      InFrontOfTheCanvas: () => (
        <>
          <PageOverlayScreen pages={pages} />
          <BottomButton />
        </>
      ),
      SharePanel: pdf
        ? () => <ExportPdfButton pdf={pdf} />
        : image
        ? () => <ExportImageButton image={image} />
        : null,
    }),
    [pdf, pages, image]
  );
  const makeSureShapesAreAtBottom = (editor: Editor, shapeIds: string[]) => {
    const shapeIdSet = new Set(shapeIds);

    const shapes = shapeIds
      .map((id) => {
        const shape = editor.getShape(id as TLParentId); // Cast `id` to `TLParentId`
        if (!shape) {
          throw new Error(`Shape with id ${id} not found.`);
        }
        return shape;
      })
      .sort(sortByIndex);

    const pageId = editor.getCurrentPageId();

    const siblings = editor.getSortedChildIdsForParent(pageId);
    const currentBottomShapes = siblings
      .slice(0, shapes.length)
      .map((id) => editor.getShape(id as TLParentId)!);

    if (currentBottomShapes.every((shape, i) => shape.id === shapes[i].id))
      return;

    const otherSiblings = siblings.filter((id) => !shapeIdSet.has(id));
    const bottomSibling = otherSiblings[0];
    const lowestIndex = editor.getShape(bottomSibling as TLParentId)!.index;

    const indexes = getIndicesBetween(undefined, lowestIndex, shapes.length);
    editor.updateShapes(
      shapes.map((shape, i) => ({
        id: shape.id,
        type: shape.type,
        isLocked: shape.isLocked,
        index: indexes[i],
      }))
    );
  };

  const updateCameraBounds = (
    editor: Editor,
    targetBounds: Box,
    isMobile: boolean
  ) => {
    editor.setCameraOptions({
      constraints: {
        bounds: targetBounds,
        padding: { x: isMobile ? 16 : 164, y: 64 },
        origin: { x: 0.5, y: 0 },
        initialZoom: "fit-x-100",
        baseZoom: "default",
        behavior: "contain",
      },
    });
    editor.setCamera(editor.getCamera(), { reset: true });
  };

  useEffect(() => {
    if (editor && pages.length > 0) {
      editor.createAssets(
        pages.map((page) => ({
          id: page.assetId,
          typeName: "asset",
          type: "image",
          meta: {},
          props: {
            w: page.bounds.w,
            h: page.bounds.h,
            mimeType: "image/png",
            src: page.src, // Use the data URL here
            name: "page",
            isAnimated: false,
          },
        }))
      );

      editor.createShapes(
        pages.map(
          (page): TLShapePartial<TLImageShape> => ({
            id: page.shapeId,
            type: "image",
            x: page.bounds.x,
            y: page.bounds.y,
            isLocked: true,
            props: {
              assetId: page.assetId,
              w: page.bounds.w,
              h: page.bounds.h,
            },
          })
        )
      );

      const shapeIds = pages.map((page) => page.shapeId);

      editor.sideEffects.registerBeforeChangeHandler("shape", (prev, next) => {
        if (!shapeIds.includes(next.id)) return next;
        if (next.isLocked) return next;
        return { ...prev, isLocked: true };
      });

      makeSureShapesAreAtBottom(editor, shapeIds);

      editor.sideEffects.registerAfterCreateHandler("shape", () =>
        makeSureShapesAreAtBottom(editor, shapeIds)
      );
      editor.sideEffects.registerAfterChangeHandler("shape", () =>
        makeSureShapesAreAtBottom(editor, shapeIds)
      );

      const targetBounds = pages.reduce(
        (acc, page) => acc.union(page.bounds),
        pages[0].bounds.clone()
      );

      let isMobile = editor.getViewportScreenBounds().width < 840;

      react("update camera", () => {
        const isMobileNow = editor.getViewportScreenBounds().width < 840;
        if (isMobileNow === isMobile) return;
        isMobile = isMobileNow;
        updateCameraBounds(editor, targetBounds, isMobile);
      });

      updateCameraBounds(editor, targetBounds, isMobile);
    }
  }, [editor, pages]);

  return (
    <Tldraw
      onMount={(editor) => {
        setEditor(editor);
        editor.updateInstanceState({ isDebugMode: false });
      }}
      components={components}
      tools={customTools}
      overrides={uiOverrides}
      inferDarkMode
    >
      <CustomUi />
    </Tldraw>
  );
}

const PageOverlayScreen = track(function PageOverlayScreen({
  pages,
}: {
  pages: PdfPage[];
}) {
  const editor = useEditor();

  const viewportPageBounds = editor.getViewportPageBounds();
  const viewportScreenBounds = editor.getViewportScreenBounds();

  const relevantPageBounds = pages
    .map((page) => {
      if (!viewportPageBounds.collides(page.bounds)) return null;
      const topLeft = editor.pageToViewport(page.bounds);
      const bottomRight = editor.pageToViewport({
        x: page.bounds.maxX,
        y: page.bounds.maxY,
      });
      return new Box(
        topLeft.x,
        topLeft.y,
        bottomRight.x - topLeft.x,
        bottomRight.y - topLeft.y
      );
    })
    .filter((bounds): bounds is Box => bounds !== null);

  function pathForPageBounds(bounds: Box) {
    return `M ${bounds.x} ${bounds.y} L ${bounds.maxX} ${bounds.y} L ${bounds.maxX} ${bounds.maxY} L ${bounds.x} ${bounds.maxY} Z`;
  }

  const viewportPath = `M 0 0 L ${viewportScreenBounds.w} 0 L ${viewportScreenBounds.w} ${viewportScreenBounds.h} L 0 ${viewportScreenBounds.h} Z`;

  return (
    <>
      <SVGContainer className="PageOverlayScreen-screen">
        <path
          d={`${viewportPath} ${relevantPageBounds
            .map(pathForPageBounds)
            .join(" ")}`}
          fillRule="evenodd"
        />
      </SVGContainer>
      {relevantPageBounds.map((bounds, i) => (
        <div
          key={i}
          className="PageOverlayScreen-outline"
          style={{
            width: bounds.w,
            height: bounds.h,
            transform: `translate(${bounds.x}px, ${bounds.y}px)`,
          }}
        />
      ))}
    </>
  );
});
