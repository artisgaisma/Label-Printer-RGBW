import { useMemo, useRef } from 'react';
import { getFontCssFamily } from '../lib/fontLibrary';
import { defaultGridSizeMm, normalizeGridSizeMm, snapPositionToGrid } from '../lib/gridUtils';

const maxCanvasWidth = 760;
const maxCanvasHeight = 420;

export default function LabelCanvas({ template, selectedId, onSelect, onObjectChange }) {
  const canvasRef = useRef(null);
  const dragStateRef = useRef(null);

  function setDragState(state) {
    dragStateRef.current = state;
  }

  function endDrag(event) {
    if (event && canvasRef.current?.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }
    setDragState(null);
  }

  const scale = useMemo(() => {
    return Math.min(maxCanvasWidth / template.widthMm, maxCanvasHeight / template.heightMm);
  }, [template.heightMm, template.widthMm]);

  const gridSizeMm = normalizeGridSizeMm(template.gridSizeMm ?? defaultGridSizeMm);
  const gridSizePx = gridSizeMm * scale;

  function pointerToMm(event) {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / scale,
      y: (event.clientY - rect.top) / scale,
    };
  }

  function startMove(event, object) {
    event.stopPropagation();
    event.preventDefault();
    onSelect(object.id);

    if (object.locked) {
      return;
    }
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

    if (object.locked) {
      return;
    }
    canvasRef.current?.setPointerCapture(event.pointerId);
    setDragState({
      mode: 'resize',
      object,
      start: pointerToMm(event),
    });
  }

  function handlePointerMove(event) {
    const drag = dragStateRef.current;
    if (!drag) {
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

    onObjectChange(drag.object.id, {
      width: Math.max(1, point.x - drag.object.x),
      height: Math.max(1, point.y - drag.object.y),
    });
  }

  return (
    <div className="canvas-shell">
      <div className="canvas-meta">
        {template.widthMm} x {template.heightMm} mm
      </div>
      <div
        ref={canvasRef}
        className="label-canvas"
        role="button"
        tabIndex={0}
        style={{
          width: `${template.widthMm * scale}px`,
          height: `${template.heightMm * scale}px`,
          background: template.background,
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerDown={() => onSelect(null)}
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
        {template.objects.map((object) => (
          <LabelObject
            key={object.id}
            object={object}
            scale={scale}
            selected={selectedId === object.id}
            onMoveStart={startMove}
            onResizeStart={startResize}
          />
        ))}
      </div>
    </div>
  );
}

function LabelObject({ object, scale, selected, onMoveStart, onResizeStart }) {
  const lineContainerHeight = getLineContainerHeight(object);
  const commonStyle = {
    left: `${object.x * scale}px`,
    top: `${object.y * scale}px`,
    width: `${object.width * scale}px`,
    height: `${(object.type === 'line' ? lineContainerHeight : Math.max(object.height, object.strokeWidth || 0.4)) * scale}px`,
  };

  return (
    <div
      className={`label-object ${selected ? 'selected' : ''} ${object.locked ? 'locked' : ''} type-${object.type}`}
      style={commonStyle}
      onPointerDown={(event) => onMoveStart(event, object)}
    >
      {object.type === 'text' && (
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
          }}
        >
          {object.text}
        </div>
      )}
      {object.type === 'rect' && <RectObject object={object} scale={scale} />}
      {object.type === 'ellipse' && <EllipseObject object={object} scale={scale} />}
      {object.type === 'line' && <LineObject object={object} scale={scale} />}
      {object.type === 'image' && (
        <img alt={object.name} className="image-object" draggable={false} src={object.src} />
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

function getLineContainerHeight(object) {
  const strokeWidth = object.strokeWidth || 0.4;
  const isHorizontal = Math.abs(object.height) < 0.01;

  if (object.lineStyle === 'double' && isHorizontal) {
    return strokeWidth * 2 + (object.doubleGap || 1);
  }

  return Math.max(Math.abs(object.height), strokeWidth);
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