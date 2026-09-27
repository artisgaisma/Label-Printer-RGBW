import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getFontCssFamily } from '../lib/fontLibrary';
import { defaultGridSizeMm, normalizeGridSizeMm, snapPositionToGrid, snapValueToGrid } from '../lib/gridUtils';
import { getObjectAngle, getTemplateMargins } from '../lib/labelModel';
import { createQrMatrix } from '../lib/qrCode';

const maxCanvasWidth = 760;
const maxCanvasHeight = 420;
const minCanvasFitPx = 80;
const doubleClickDistancePx = 8;
const doubleClickMs = 450;

export default function LabelCanvas({
  template,
  selectedId,
  onSelect,
  onObjectChange,
  onHistoryGestureStart,
  onHistoryGestureEnd,
}) {
  const canvasRef = useRef(null);
  const shellRef = useRef(null);
  const dragStateRef = useRef(null);
  const lastTextClickRef = useRef(null);
  const [editingTextId, setEditingTextId] = useState(null);
  const [fitSize, setFitSize] = useState({ width: maxCanvasWidth, height: maxCanvasHeight });

  function setDragState(state) {
    dragStateRef.current = state;
  }

  function endDrag(event) {
    if (event && canvasRef.current?.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }

    if (dragStateRef.current) {
      onHistoryGestureEnd?.();
    }

    setDragState(null);
  }

  useLayoutEffect(() => {
    const shell = shellRef.current;
    const stage = shell?.closest('.stage');
    if (!shell || !stage) {
      return undefined;
    }

    function updateFitSize() {
      setFitSize(measureCanvasFit(stage, shell));
    }

    const observer = new ResizeObserver(updateFitSize);
    observer.observe(stage);
    updateFitSize();
    return () => observer.disconnect();
  }, []);

  const scale = useMemo(() => {
    const widthMm = Math.max(template.widthMm, 1);
    const heightMm = Math.max(template.heightMm, 1);
    return Math.min(
      fitSize.width / widthMm,
      fitSize.height / heightMm,
      maxCanvasWidth / widthMm,
      maxCanvasHeight / heightMm,
    );
  }, [fitSize.height, fitSize.width, template.heightMm, template.widthMm]);

  const gridSizeMm = normalizeGridSizeMm(template.gridSizeMm ?? defaultGridSizeMm);
  const gridSizePx = gridSizeMm * scale;
  const margins = getTemplateMargins(template);
  const showMargins = margins.left > 0 || margins.right > 0 || margins.top > 0 || margins.bottom > 0;

  function pointerToMm(event) {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / scale,
      y: (event.clientY - rect.top) / scale,
    };
  }

  function isObjectLocked(objectOrId) {
    const id = typeof objectOrId === 'string' ? objectOrId : objectOrId?.id;
    const current = template.objects.find((item) => item.id === id);
    return Boolean(current?.locked ?? objectOrId?.locked);
  }

  function startMove(event, object) {
    if (object.type === 'text' && isTextDoubleClick(event, object)) {
      startTextEdit(event, object);
      return;
    }

    event.stopPropagation();
    event.preventDefault();
    onSelect(object.id);

    if (isObjectLocked(object)) {
      return;
    }

    onHistoryGestureStart?.();
    canvasRef.current?.setPointerCapture(event.pointerId);
    const point = pointerToMm(event);
    setDragState({
      mode: 'move',
      object,
      offsetX: point.x - object.x,
      offsetY: point.y - object.y,
    });
  }

  function startResize(event, object) {
    event.stopPropagation();
    event.preventDefault();
    onSelect(object.id);

    if (isObjectLocked(object)) {
      return;
    }

    onHistoryGestureStart?.();
    canvasRef.current?.setPointerCapture(event.pointerId);
    setDragState({
      mode: 'resize',
      object,
      start: pointerToMm(event),
    });
  }

  function startRotate(event, object) {
    event.stopPropagation();
    event.preventDefault();
    onSelect(object.id);

    if (isObjectLocked(object)) {
      return;
    }

    onHistoryGestureStart?.();
    canvasRef.current?.setPointerCapture(event.pointerId);
    setDragState({
      mode: 'rotate',
      object,
    });
  }

  function startTextEdit(event, object) {
    event.stopPropagation();
    event.preventDefault();
    onSelect(object.id);
    endDrag(event);
    lastTextClickRef.current = null;
    onHistoryGestureStart?.();
    setEditingTextId(object.id);
  }

  function isTextDoubleClick(event, object) {
    const now = window.performance.now();
    const lastClick = lastTextClickRef.current;
    lastTextClickRef.current = {
      id: object.id,
      time: now,
      x: event.clientX,
      y: event.clientY,
    };

    if (!lastClick || lastClick.id !== object.id) {
      return false;
    }

    return (
      now - lastClick.time <= doubleClickMs &&
      Math.abs(event.clientX - lastClick.x) <= doubleClickDistancePx &&
      Math.abs(event.clientY - lastClick.y) <= doubleClickDistancePx
    );
  }

  function handlePointerMove(event) {
    const drag = dragStateRef.current;
    if (!drag) {
      return;
    }

    if (isObjectLocked(drag.object.id)) {
      endDrag(event);
      return;
    }

    const point = pointerToMm(event);
    if (drag.mode === 'move') {
      let x = point.x - drag.offsetX;
      let y = point.y - drag.offsetY;

      if (template.snapToGrid) {
        ({ x, y } = snapPositionToGrid(x, y, gridSizeMm));
      }

      onObjectChange(drag.object.id, { x, y });
      return;
    }

    if (drag.mode === 'rotate') {
      const center = getObjectCenterMm(drag.object);
      let angle = (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI + 90;
      if (event.shiftKey) {
        angle = Math.round(angle / 15) * 15;
      }
      onObjectChange(drag.object.id, { angle });
      return;
    }

    const angle = getObjectAngle(drag.object);
    const center = getObjectCenterMm(drag.object);
    const localPoint = angle
      ? rotatePointAround(point.x, point.y, center.x, center.y, -angle)
      : point;

    let width = localPoint.x - drag.object.x;
    let height = localPoint.y - drag.object.y;

    if (template.snapToGrid) {
      width = snapValueToGrid(width, gridSizeMm);
      height = snapValueToGrid(height, gridSizeMm);
    }

    width = Math.max(template.snapToGrid ? gridSizeMm : 1, width);
    height = Math.max(template.snapToGrid ? gridSizeMm : 1, height);

    if (!angle) {
      onObjectChange(drag.object.id, { width, height });
      return;
    }

    const nwWorld = rotatePointAround(drag.object.x, drag.object.y, center.x, center.y, angle);
    const halfOffset = rotatePointAround(width / 2, height / 2, 0, 0, angle);
    const nextCenter = {
      x: nwWorld.x + halfOffset.x,
      y: nwWorld.y + halfOffset.y,
    };

    onObjectChange(drag.object.id, {
      x: nextCenter.x - width / 2,
      y: nextCenter.y - height / 2,
      width,
      height,
    });
  }

  return (
    <div ref={shellRef} className="canvas-shell">
      <div className="canvas-meta">
        {template.widthMm} x {template.heightMm} mm
      </div>
      <div
        ref={canvasRef}
        className="label-canvas"
        data-document-theme={template.documentThemeId || 'white'}
        role="button"
        tabIndex={0}
        style={{
          width: `${template.widthMm * scale}px`,
          height: `${template.heightMm * scale}px`,
          backgroundColor: template.background,
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerDown={() => {
          onSelect(null);
          if (editingTextId) {
            setEditingTextId(null);
            onHistoryGestureEnd?.();
          }
        }}
      >
        {template.showGrid && (
          <div
            aria-hidden="true"
            className="canvas-grid"
            style={{
              backgroundSize: `${gridSizePx}px ${gridSizePx}px`,
            }}
          />
        )}
        {showMargins && (
          <div
            aria-hidden="true"
            className="canvas-margins"
            style={{
              left: `${margins.left * scale}px`,
              right: `${margins.right * scale}px`,
              top: `${margins.top * scale}px`,
              bottom: `${margins.bottom * scale}px`,
            }}
          />
        )}
        {template.objects.map((object) => (
          <LabelObject
            key={object.id}
            object={object}
            scale={scale}
            selected={selectedId === object.id}
            editing={editingTextId === object.id}
            onMoveStart={startMove}
            onObjectChange={onObjectChange}
            onResizeStart={startResize}
            onRotateStart={startRotate}
            onTextEditEnd={() => {
              setEditingTextId(null);
              onHistoryGestureEnd?.();
            }}
          />
        ))}
      </div>
    </div>
  );
}

function LabelObject({
  object,
  scale,
  selected,
  editing,
  onMoveStart,
  onObjectChange,
  onResizeStart,
  onRotateStart,
  onTextEditEnd,
}) {
  const lineContainerHeight = getLineContainerHeight(object);
  const angle = getObjectAngle(object);
  const commonStyle = {
    left: `${object.x * scale}px`,
    top: `${object.y * scale}px`,
    width: `${object.width * scale}px`,
    height: `${(object.type === 'line' ? lineContainerHeight : Math.max(object.height, object.strokeWidth || 0.4)) * scale}px`,
    transform: angle ? `rotate(${angle}deg)` : undefined,
    transformOrigin: 'center center',
  };

  return (
    <div
      className={`label-object ${selected ? 'selected' : ''} ${object.locked ? 'locked' : ''} type-${object.type}`}
      style={commonStyle}
      onPointerDown={(event) => onMoveStart(event, object)}
    >
      {object.type === 'text' && !editing && (
        <div
          className="text-object"
          style={{
            color: object.color,
            fontFamily: getFontCssFamily(object.fontFamily),
            fontSize: `${object.fontSize * scale}px`,
            fontWeight: object.fontWeight,
            fontStyle: object.fontStyle || 'normal',
            textDecoration: object.textDecoration || 'none',
            letterSpacing: `${(object.letterSpacing || 0) * scale}px`,
            textAlign: object.textAlign,
            justifyContent: getTextJustifyContent(object.textAlign),
          }}
        >
          {object.text}
        </div>
      )}
      {object.type === 'text' && editing && (
        <InlineTextEditor
          object={object}
          scale={scale}
          onChange={(text) => onObjectChange(object.id, { text })}
          onDone={onTextEditEnd}
        />
      )}
      {object.type === 'rect' && <RectObject object={object} scale={scale} />}
      {object.type === 'ellipse' && <EllipseObject object={object} scale={scale} />}
      {object.type === 'line' && <LineObject object={object} scale={scale} />}
      {object.type === 'image' && (
        <img alt={object.name} className="image-object" draggable={false} src={object.src} />
      )}
      {object.type === 'qr' && <QrObject object={object} />}
      {selected && !object.locked && (
        <button
          aria-label="Rotate object"
          className="rotate-handle"
          type="button"
          onPointerDown={(event) => onRotateStart(event, object)}
        />
      )}
      {selected && !object.locked && object.type !== 'line' && (
        <button
          aria-label="Resize object"
          className="resize-handle"
          type="button"
          onPointerDown={(event) => onResizeStart(event, object)}
        />
      )}
    </div>
  );
}

function QrObject({ object }) {
  const matrix = createQrMatrix(object);

  if (!matrix) {
    return <div className="qr-code-placeholder">QR</div>;
  }

  const quietZone = 1;
  const viewBoxSize = matrix.size + quietZone * 2;

  return (
    <svg aria-label={object.name || 'QR code'} className="qr-code-object" role="img" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
      <rect fill="#ffffff" height={viewBoxSize} width={viewBoxSize} />
      {matrix.data.map((filled, index) => {
        if (!filled) {
          return null;
        }

        const x = (index % matrix.size) + quietZone;
        const y = Math.floor(index / matrix.size) + quietZone;

        return <rect key={index} fill="#000000" height="1" width="1" x={x} y={y} />;
      })}
    </svg>
  );
}

function InlineTextEditor({ object, scale, onChange, onDone }) {
  const editorRef = useRef(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.focus();
    editor.select();
  }, []);

  return (
    <textarea
      ref={editorRef}
      className="text-object-editor"
      spellCheck={false}
      value={object.text}
      style={{
        color: object.color,
        fontFamily: getFontCssFamily(object.fontFamily),
        fontSize: `${object.fontSize * scale}px`,
        fontWeight: object.fontWeight,
        fontStyle: object.fontStyle || 'normal',
        textDecoration: object.textDecoration || 'none',
        letterSpacing: `${(object.letterSpacing || 0) * scale}px`,
        textAlign: object.textAlign,
      }}
      onBlur={onDone}
      onChange={(event) => onChange(event.target.value)}
      onDoubleClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.currentTarget.blur();
        }
      }}
      onPointerDown={(event) => event.stopPropagation()}
    />
  );
}

function RectObject({ object, scale }) {
  const strokeWidth = (object.strokeWidth || 0.4) * scale;
  const width = object.width * scale;
  const height = object.height * scale;
  const lineStyle = object.lineStyle || 'solid';
  const doubleGap = (object.doubleGap || 1) * scale;
  const radius = (object.radius || 0) * scale;
  const fill = object.fill === 'transparent' ? 'none' : object.fill;
  const stroke = object.stroke;
  const outerX = strokeWidth / 2;
  const outerY = strokeWidth / 2;
  const outerWidth = Math.max(width - strokeWidth, 0);
  const outerHeight = Math.max(height - strokeWidth, 0);
  const outerRadius = Math.max(radius - strokeWidth / 2, 0);

  if (lineStyle === 'double') {
    const innerX = strokeWidth + doubleGap + strokeWidth / 2;
    const innerY = strokeWidth + doubleGap + strokeWidth / 2;
    const innerWidth = Math.max(width - 2 * strokeWidth - 2 * doubleGap, 0);
    const innerHeight = Math.max(height - 2 * strokeWidth - 2 * doubleGap, 0);
    const innerRadius = Math.max(radius - strokeWidth - doubleGap - strokeWidth / 2, 0);

    return (
      <svg aria-hidden="true" className="shape-svg" height={height} viewBox={`0 0 ${width} ${height}`} width={width}>
        {fill !== 'none' && outerWidth > 0 && outerHeight > 0 && (
          <rect fill={fill} height={outerHeight} rx={outerRadius} ry={outerRadius} width={outerWidth} x={outerX} y={outerY} />
        )}
        {outerWidth > 0 && outerHeight > 0 && (
          <rect
            fill="none"
            height={outerHeight}
            rx={outerRadius}
            ry={outerRadius}
            stroke={stroke}
            strokeWidth={strokeWidth}
            width={outerWidth}
            x={outerX}
            y={outerY}
          />
        )}
        {innerWidth > 0 && innerHeight > 0 && (
          <rect
            fill="none"
            height={innerHeight}
            rx={innerRadius}
            ry={innerRadius}
            stroke={stroke}
            strokeWidth={strokeWidth}
            width={innerWidth}
            x={innerX}
            y={innerY}
          />
        )}
      </svg>
    );
  }

  const dashArray = getLineDashArray(lineStyle, strokeWidth);

  return (
    <svg aria-hidden="true" className="shape-svg" height={height} viewBox={`0 0 ${width} ${height}`} width={width}>
      <rect
        fill={fill}
        height={outerHeight}
        rx={outerRadius}
        ry={outerRadius}
        stroke={stroke}
        strokeDasharray={dashArray}
        strokeLinecap={lineStyle === 'dotted' ? 'round' : 'butt'}
        strokeWidth={strokeWidth}
        width={outerWidth}
        x={outerX}
        y={outerY}
      />
    </svg>
  );
}

function EllipseObject({ object, scale }) {
  const strokeWidth = (object.strokeWidth || 0.4) * scale;
  const width = object.width * scale;
  const height = object.height * scale;
  const lineStyle = object.lineStyle || 'solid';
  const doubleGap = (object.doubleGap || 1) * scale;
  const fill = object.fill === 'transparent' ? 'none' : object.fill;
  const stroke = object.stroke;
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadiusX = Math.max(width / 2 - strokeWidth / 2, 0);
  const outerRadiusY = Math.max(height / 2 - strokeWidth / 2, 0);

  if (lineStyle === 'double') {
    const innerRadiusX = Math.max(width / 2 - strokeWidth - doubleGap - strokeWidth / 2, 0);
    const innerRadiusY = Math.max(height / 2 - strokeWidth - doubleGap - strokeWidth / 2, 0);

    return (
      <svg aria-hidden="true" className="shape-svg" height={height} viewBox={`0 0 ${width} ${height}`} width={width}>
        {fill !== 'none' && outerRadiusX > 0 && outerRadiusY > 0 && (
          <ellipse cx={centerX} cy={centerY} fill={fill} rx={outerRadiusX} ry={outerRadiusY} />
        )}
        {outerRadiusX > 0 && outerRadiusY > 0 && (
          <ellipse
            cx={centerX}
            cy={centerY}
            fill="none"
            rx={outerRadiusX}
            ry={outerRadiusY}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        )}
        {innerRadiusX > 0 && innerRadiusY > 0 && (
          <ellipse
            cx={centerX}
            cy={centerY}
            fill="none"
            rx={innerRadiusX}
            ry={innerRadiusY}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        )}
      </svg>
    );
  }

  const dashArray = getLineDashArray(lineStyle, strokeWidth);

  return (
    <svg aria-hidden="true" className="shape-svg" height={height} viewBox={`0 0 ${width} ${height}`} width={width}>
      <ellipse
        cx={centerX}
        cy={centerY}
        fill={fill}
        rx={outerRadiusX}
        ry={outerRadiusY}
        stroke={stroke}
        strokeDasharray={dashArray}
        strokeLinecap={lineStyle === 'dotted' ? 'round' : 'butt'}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}

function LineObject({ object, scale }) {
  const strokeWidth = (object.strokeWidth || 0.4) * scale;
  const width = Math.max(object.width * scale, 1);
  const heightDelta = object.height * scale;
  const lineStyle = object.lineStyle || 'solid';
  const doubleGap = (object.doubleGap || 1) * scale;
  const isHorizontal = Math.abs(object.height) < 0.01;
  const svgHeight = getLineContainerHeight(object) * scale;

  if (lineStyle === 'double') {
    if (isHorizontal) {
      const firstY = strokeWidth / 2;
      const secondY = strokeWidth / 2 + strokeWidth + doubleGap;
      return (
        <svg aria-hidden="true" className="line-svg" height={svgHeight} viewBox={`0 0 ${width} ${svgHeight}`} width={width}>
          <line stroke={object.stroke} strokeWidth={strokeWidth} x1={0} x2={width} y1={firstY} y2={firstY} />
          <line stroke={object.stroke} strokeWidth={strokeWidth} x1={0} x2={width} y1={secondY} y2={secondY} />
        </svg>
      );
    }

    const offset = (strokeWidth + doubleGap) / 2;
    const x2 = width;
    const y2 = heightDelta;
    const normalLength = Math.hypot(width, heightDelta) || 1;
    const offsetX = (-heightDelta / normalLength) * offset;
    const offsetY = (width / normalLength) * offset;

    return (
      <svg aria-hidden="true" className="line-svg" height={svgHeight} viewBox={`0 0 ${width} ${svgHeight}`} width={width}>
        <line
          stroke={object.stroke}
          strokeWidth={strokeWidth}
          x1={offsetX}
          x2={x2 + offsetX}
          y1={-offsetY}
          y2={y2 - offsetY}
        />
        <line
          stroke={object.stroke}
          strokeWidth={strokeWidth}
          x1={-offsetX}
          x2={x2 - offsetX}
          y1={offsetY}
          y2={y2 + offsetY}
        />
      </svg>
    );
  }

  const dashArray = getLineDashArray(lineStyle, strokeWidth);
  const y1 = isHorizontal ? svgHeight / 2 : heightDelta >= 0 ? 0 : svgHeight;
  const y2 = isHorizontal ? svgHeight / 2 : heightDelta >= 0 ? svgHeight : 0;

  return (
    <svg aria-hidden="true" className="line-svg" height={svgHeight} viewBox={`0 0 ${width} ${svgHeight}`} width={width}>
      <line
        stroke={object.stroke}
        strokeDasharray={dashArray}
        strokeLinecap={lineStyle === 'dotted' ? 'round' : 'butt'}
        strokeWidth={strokeWidth}
        x1={0}
        x2={width}
        y1={y1}
        y2={isHorizontal ? y1 : y2}
      />
    </svg>
  );
}

function measureCanvasFit(stage, shell) {
  const stageStyles = getComputedStyle(stage);
  const padX = parseFloat(stageStyles.paddingLeft) + parseFloat(stageStyles.paddingRight);
  const padY = parseFloat(stageStyles.paddingTop) + parseFloat(stageStyles.paddingBottom);
  const shellStyles = getComputedStyle(shell);
  const gap = parseFloat(shellStyles.rowGap || shellStyles.gap) || 0;
  const meta = shell.querySelector('.canvas-meta');
  const metaHeight = meta ? meta.getBoundingClientRect().height + gap : 0;

  return {
    width: Math.max(minCanvasFitPx, stage.clientWidth - padX),
    height: Math.max(minCanvasFitPx, stage.clientHeight - padY - metaHeight),
  };
}

function getLineContainerHeight(object) {
  const strokeWidth = object.strokeWidth || 0.4;
  const isHorizontal = Math.abs(object.height) < 0.01;

  if (object.lineStyle === 'double' && isHorizontal) {
    return strokeWidth * 2 + (object.doubleGap || 1);
  }

  return Math.max(Math.abs(object.height), strokeWidth);
}

function getTextJustifyContent(textAlign) {
  if (textAlign === 'center') {
    return 'center';
  }

  if (textAlign === 'right') {
    return 'flex-end';
  }

  return 'flex-start';
}

function getLineDashArray(lineStyle, strokeWidth) {
  switch (lineStyle) {
    case 'dashed':
      return `${strokeWidth * 6} ${strokeWidth * 3}`;
    case 'dotted':
      return `${strokeWidth} ${strokeWidth * 2}`;
    case 'dash-dot':
      return `${strokeWidth * 6} ${strokeWidth * 2} ${strokeWidth} ${strokeWidth * 2}`;
    case 'long-dash':
      return `${strokeWidth * 10} ${strokeWidth * 4}`;
    default:
      return undefined;
  }
}

function getObjectCenterMm(object) {
  const height =
    object.type === 'line'
      ? getLineContainerHeight(object)
      : Math.max(Number(object.height) || 0, object.strokeWidth || 0.4);

  return {
    x: object.x + object.width / 2,
    y: object.y + height / 2,
  };
}

function rotatePointAround(x, y, cx, cy, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - cx;
  const dy = y - cy;

  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  };
}