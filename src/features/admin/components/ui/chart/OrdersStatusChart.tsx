"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { useMemo } from "react";
import { useThemeMode } from "@/components/ui/theme/ThemeProvider";
import { chartPalette, legendOptions, STATUS_COLORS } from "./theme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface Props {
  data: { day: string; status: string; count: number }[];
  /** Label status terurut (id & en) untuk legend + urutan stack. */
  statusLabels: Record<string, string>;
}

/** Grafik batang bertumpuk: order per hari dipecah per status pembayaran. */
export default function OrdersStatusChart({ data, statusLabels }: Props) {
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const palette = chartPalette(isDark);

  const statuses = Object.keys(statusLabels);

  const { labels, datasets } = useMemo(() => {
    const days: string[] = [];
    for (const row of data) {
      if (!days.includes(row.day)) days.push(row.day);
    }
    const countOf = (day: string, status: string) =>
      data.find((row) => row.day === day && row.status === status)?.count ?? 0;

    return {
      labels: days,
      datasets: statuses.map((status) => ({
        label: statusLabels[status],
        data: days.map((day) => countOf(day, status)),
        backgroundColor: STATUS_COLORS[status] ?? "#8c8c8c",
        borderRadius: 4,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        stack: "orders",
      })),
    };
  }, [data, statuses, statusLabels]);

  const chartData: ChartData<"bar"> = { labels, datasets };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: legendOptions(palette.tickColor),
      tooltip: palette.tooltip,
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: palette.tickColor, font: { size: 11 }, maxTicksLimit: 10 },
        border: { display: false },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: palette.gridColor, drawTicks: false },
        ticks: { color: palette.tickColor, font: { size: 11 }, precision: 0 },
        border: { display: false },
      },
    },
  };

  return (
    <div className="h-72 w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
