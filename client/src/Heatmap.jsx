import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js-dist-min";

const Plot = createPlotlyComponent(Plotly);

/** Stops from Plotly.js's built-in Jet colorscale, used for label contrast. */
const JET = [
  [0, [0, 0, 131]],
  [0.125, [0, 60, 170]],
  [0.375, [5, 255, 255]],
  [0.625, [255, 255, 0]],
  [0.875, [250, 0, 0]],
  [1, [128, 0, 0]],
];

function jetRgb(t) {
  let index = 1;
  while (index < JET.length - 1 && JET[index][0] < t) {
    index += 1;
  }
  const [start, startColor] = JET[index - 1];
  const [end, endColor] = JET[index];
  const span = end - start;
  const mix = span === 0 ? 0 : (t - start) / span;
  return startColor.map(
    (channel, channelIndex) => channel + (endColor[channelIndex] - channel) * mix,
  );
}

function annotationColor(count, minCount, maxCount) {
  const t = maxCount === minCount ? 1 : (count - minCount) / (maxCount - minCount);
  const [red, green, blue] = jetRgb(t);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.6 ? "#111" : "#fff";
}

function countAnnotations(counts) {
  let minCount = Infinity;
  let maxCount = -Infinity;
  for (const row of counts) {
    for (const count of row) {
      if (count == null) {
        continue;
      }
      if (count < minCount) {
        minCount = count;
      }
      if (count > maxCount) {
        maxCount = count;
      }
    }
  }
  if (minCount === Infinity) {
    return [];
  }

  const annotations = [];
  counts.forEach((row, y) => {
    row.forEach((count, x) => {
      if (count == null) {
        return;
      }
      annotations.push({
        x,
        y,
        text: String(count),
        showarrow: false,
        font: {
          color: annotationColor(count, minCount, maxCount),
          size: 14,
        },
      });
    });
  });
  return annotations;
}

function cellBorderShapes(size) {
  const shapes = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      shapes.push({
        type: "rect",
        x0: col - 0.5,
        x1: col + 0.5,
        y0: row - 0.5,
        y1: row + 0.5,
        line: { color: "#555", width: 1 },
        fillcolor: "rgba(0,0,0,0)",
      });
    }
  }
  return shapes;
}

const axis = {
  dtick: 1,
  tickmode: "linear",
  showgrid: false,
  zeroline: false,
};

export default function Heatmap({ counts, dimension }) {
  return (
    <div className="heatmap">
      <Plot
        key={dimension}
        data={[
          {
            z: counts,
            type: "heatmap",
            colorscale: "Jet",
            showscale: true,
            hoverongaps: false,
            hovertemplate: "row %{y}<br>column %{x}<br>count %{z}<extra></extra>",
            colorbar: { title: { text: "count" } },
          },
        ]}
        layout={{
          autosize: true,
          margin: { t: 16, r: 16, b: 40, l: 48 },
          xaxis: { ...axis, title: { text: "column" } },
          yaxis: { ...axis, title: { text: "row" } },
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          annotations: countAnnotations(counts),
          shapes: cellBorderShapes(dimension),
        }}
        config={{ displayModeBar: false, responsive: true }}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
