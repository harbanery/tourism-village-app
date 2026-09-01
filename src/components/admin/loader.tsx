"use client";

import { Spin } from "antd";

/** Loader halaman penuh saat fetch data admin. */
const LoaderPage = () => {
  return (
    <div className="flex justify-center items-center min-h-[50vh] w-full">
      <Spin size="large" />
    </div>
  );
};

export default LoaderPage;
