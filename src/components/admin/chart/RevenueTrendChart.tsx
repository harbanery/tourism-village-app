"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { useMemo } from "react";
import { useThemeMode } from "@/components/theme/ThemeProvider";
import { chartPalette } from "./theme";
import { formatRupiah } from "@/utils/format";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface Props {
  data: { day: string; revenue: number; orders: number }[];
}

/** Grafik garis: pendapatan harian (fill gradien, pola DailyCompletionChart). */
export default function RevenueTrendChart({ data }: Props) {
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const palette = chartPalette(isDark);

  const { labels, values } = useMemo(
    () => ({
      labels: data.map((row) => row.day),
      values: data.map((row) => row.revenue),
    }),
    [data],
  );

  const primary = "#0d7a5f";

  const chartData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Revenue",
        data: values,
        borderColor: primary,
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: canvasCtx, chartArea } = chart;
          if (!chartArea) return "rgba(13,122,95,0.15)";
          const gradient = canvasCtx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom,
          );
          gradient.addColorStop(0, "rgba(13,122,95,0.35)");
          gradient.addColorStop(1, "rgba(13,122,95,0.02)");
          return gradient;
        },
        borderWidth: 2,
        pointRadius: 2.5,
        pointHoverRadius: 6,
        pointBackgroundColor: primary,
        pointBorderColor: "transparent",
        fill: true,
        tension: 0.35,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
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
        grid: { color: palette.gridColor, drawTicks: false },
        ticks: { color: palette.tickColor, font: { size: 11 }, maxTicksLimit: 10 },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: palette.gridColor, drawTicks: false },
        ticks: {
          color: palette.tickColor,
          font: { size: 11 },
          callback: (value) => formatRupiah(Number(value)),
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="h-72 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}
