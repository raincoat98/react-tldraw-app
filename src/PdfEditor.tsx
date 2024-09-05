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
  DefaultToolbar,
  DefaultToolbarContent,
  TldrawUiMenuItem,
  useIsToolSelected,
  useTools,
  TLUiOverrides,
  TLUiAssetUrlOverrides,
} from "tldraw";
import { ExportPdfButton } from "./ExportPdfButton";
import { CustomUi } from "./CustomUi";
import { Pdf } from "./PdfPicker";
import { StickerTool } from "./sticker-tool-util";

const uiOverrides: TLUiOverrides = {
  tools(editor, tools) {
    // Create a tool item in the ui's context.
    tools.sticker = {
      id: "sticker",
      icon: "heart-icon",
      label: "Sticker",
      kbd: "s",
      onSelect: () => {
        editor.setCurrentTool("sticker");
      },
    };
    return tools;
  },
};

// [3]
export const customAssetUrls: TLUiAssetUrlOverrides = {
  icons: {
    "heart-icon": "/heart-icon.svg",
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

const customTools = [StickerTool];

export function PdfEditor({ pdf }: { pdf: Pdf }) {
  const [editor, setEditor] = useState<Editor | null>(null);

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
      // ZoomMenu: null,
      // MainMenu: null,
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
            {/* Ideally, we'd interleave this into the tools group */}
            <TldrawUiMenuItem {...tools["sticker"]} />
          </DefaultKeyboardShortcutsDialog>
        );
      },
      QuickActions: null,
      HelperButtons: null,
      DebugPanel: null,
      DebugMenu: null,
      // MenuPanel: null,

      CursorChatBubble: null,
      TopPanel: () => <CustomUi />,
      InFrontOfTheCanvas: () => <PageOverlayScreen pdf={pdf} />,
      SharePanel: () => <ExportPdfButton pdf={pdf} />,
    }),
    [pdf]
  );

  return (
    <Tldraw
      onMount={(editor) => {
        setEditor(editor);
        editor.updateInstanceState({ isDebugMode: false });
        editor.createAssets(
          pdf.pages.map((page) => ({
            id: page.assetId,
            typeName: "asset",
            type: "image",
            meta: {},
            props: {
              w: page.bounds.w,
              h: page.bounds.h,
              mimeType: "image/png",
              src: page.src,
              name: "page",
              isAnimated: false,
            },
          }))
        );
        editor.createShapes(
          pdf.pages.map(
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

        const shapeIds = pdf.pages.map((page) => page.shapeId);
        const shapeIdSet = new Set(shapeIds);

        // Don't let the user unlock the pages
        editor.sideEffects.registerBeforeChangeHandler(
          "shape",
          (prev, next) => {
            if (!shapeIdSet.has(next.id)) return next;
            if (next.isLocked) return next;
            return { ...prev, isLocked: true };
          }
        );

        // Make sure the shapes are below any of the other shapes
        function makeSureShapesAreAtBottom() {
          const shapes = shapeIds
            .map((id) => editor.getShape(id)!)
            .sort(sortByIndex);
          const pageId = editor.getCurrentPageId();

          const siblings = editor.getSortedChildIdsForParent(pageId);
          const currentBottomShapes = siblings
            .slice(0, shapes.length)
            .map((id) => editor.getShape(id)!);

          if (
            currentBottomShapes.every((shape, i) => shape.id === shapes[i].id)
          )
            return;

          const otherSiblings = siblings.filter((id) => !shapeIdSet.has(id));
          const bottomSibling = otherSiblings[0];
          const lowestIndex = editor.getShape(bottomSibling)!.index;

          const indexes = getIndicesBetween(
            undefined,
            lowestIndex,
            shapes.length
          );
          editor.updateShapes(
            shapes.map((shape, i) => ({
              id: shape.id,
              type: shape.type,
              isLocked: shape.isLocked,
              index: indexes[i],
            }))
          );
        }

        makeSureShapesAreAtBottom();
        editor.sideEffects.registerAfterCreateHandler(
          "shape",
          makeSureShapesAreAtBottom
        );
        editor.sideEffects.registerAfterChangeHandler(
          "shape",
          makeSureShapesAreAtBottom
        );

        // Constrain the camera to the bounds of the pages
        const targetBounds = pdf.pages.reduce(
          (acc, page) => acc.union(page.bounds),
          pdf.pages[0].bounds.clone()
        );

        function updateCameraBounds(isMobile: boolean) {
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
        }

        let isMobile = editor.getViewportScreenBounds().width < 840;

        react("update camera", () => {
          const isMobileNow = editor.getViewportScreenBounds().width < 840;
          if (isMobileNow === isMobile) return;
          isMobile = isMobileNow;
          updateCameraBounds(isMobile);
        });

        updateCameraBounds(isMobile);
      }}
      components={components}
      // inferDarkMode
      tools={customTools}
      overrides={uiOverrides}
      assetUrls={customAssetUrls}
    >
      <CustomUi />
    </Tldraw>
  );
}

const PageOverlayScreen = track(function PageOverlayScreen({
  pdf,
}: {
  pdf: Pdf;
}) {
  const editor = useEditor();

  const viewportPageBounds = editor.getViewportPageBounds();
  const viewportScreenBounds = editor.getViewportScreenBounds();

  const relevantPageBounds = pdf.pages
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
