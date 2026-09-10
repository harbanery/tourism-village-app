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
import { chartPalette } from "./theme";
import { formatRupiah } from "@/utils/helpers";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface Props {
  data: { name: string; quantity: number; revenue: number }[];
}

/** Grafik batang horizontal: paket terlaris (PAID) berdasarkan pendapatan. */
export default function TopPackagesChart({ data }: Props) {
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const palette = chartPalette(isDark);

  const { labels, values } = useMemo(
    () => ({
      // reverse agar paket terbesar tampil paling atas.
      labels: [...data].reverse().map((row) => row.name),
      values: [...data].reverse().map((row) => row.revenue),
    }),
    [data],
  );

  const chartData: ChartData<"bar"> = {
    labels,
    datasets: [
      {
        label: "Revenue",
        data: values,
        backgroundColor: "#0d7a5f",
        borderRadius: 4,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...palette.tooltip,
        callbacks: {
          label: (item) => ` ${formatRupiah(Number(item.raw))}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: palette.gridColor, drawTicks: false },
        ticks: {
          color: palette.tickColor,
          font: { size: 11 },
          callback: (value) => formatRupiah(Number(value)),
        },
        border: { display: false },
      },
      y: {
        grid: { display: false },
        ticks: { color: palette.tickColor, font: { size: 11 } },
        border: { display: false },
      },
    },
  };

  return (
    <div className="h-64 w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
