"use client";

import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { useMemo } from "react";
import { useThemeMode } from "@/components/theme/ThemeProvider";
import { chartPalette, legendOptions, ACCENT_COLORS } from "./theme";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Segment {
  label: string;
  value: number;
}

interface Props {
  segments: Segment[];
}

/** Doughnut generik dua segmen (mis. rasio menginap, pembeli baru vs kembali). */
export default function RatioDoughnutChart({ segments }: Props) {
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const palette = chartPalette(isDark);

  const total = useMemo(
    () => segments.reduce((acc, s) => acc + s.value, 0),
    [segments],
  );

  const chartData: ChartData<"doughnut"> = {
    labels: segments.map((s) => s.label),
    datasets: [
      {
        data: segments.map((s) => s.value),
        backgroundColor: segments.map((_, i) => ACCENT_COLORS[i % ACCENT_COLORS.length]),
        borderColor: palette.doughnutBorder,
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: legendOptions(palette.tickColor),
      tooltip: {
        ...palette.tooltip,
        callbacks: {
          label: (item) => {
            const raw = Number(item.raw);
            const pct = total > 0 ? Math.round((raw / total) * 100) : 0;
            return ` ${item.label}: ${raw} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="h-64 w-full">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
