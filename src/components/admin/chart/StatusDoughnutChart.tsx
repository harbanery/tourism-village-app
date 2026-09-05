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
import { chartPalette, legendOptions, STATUS_COLORS } from "./theme";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  data: { status: string; count: number }[];
  /** Label status terurut (id & en) untuk legend. */
  statusLabels: Record<string, string>;
}

/** Doughnut komposisi status pembayaran periode. */
export default function StatusDoughnutChart({ data, statusLabels }: Props) {
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const palette = chartPalette(isDark);

  const total = useMemo(
    () => data.reduce((acc, row) => acc + row.count, 0),
    [data],
  );

  const chartData: ChartData<"doughnut"> = {
    labels: data.map((row) => statusLabels[row.status] ?? row.status),
    datasets: [
      {
        data: data.map((row) => row.count),
        backgroundColor: data.map(
          (row) => STATUS_COLORS[row.status] ?? "#8c8c8c",
        ),
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
