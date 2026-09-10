"use client";

import { useEffect, useState, memo } from "react";
import { IconBaseProps as AntdIconProps } from "@ant-design/icons/lib/components/Icon";
import { LoadingOutlined } from "@ant-design/icons";

type DynamicIconLoader<T> = (iconName: string) => React.FC<T>;
const antdIconCache: Record<
  string,
  React.ComponentType<AntdIconProps> | null
> = {};

/** Loader ikon antd dinamis dengan cache (pola admin-portfolio). */
export const loadAntdIcon: DynamicIconLoader<AntdIconProps> = (iconName) => {
  const DynamicIconComponent: React.FC<AntdIconProps> = memo((props) => {
    const [IconComponent, setIconComponent] =
      useState<React.ComponentType<AntdIconProps> | null>(
        antdIconCache[iconName] || null,
      );

    useEffect(() => {
      if (!antdIconCache[iconName]) {
        let cancelled = false;
        const loadIcon = async () => {
          try {
            const mod = await import("@ant-design/icons");
            const Component = mod[
              iconName as keyof typeof mod
            ] as React.ComponentType<AntdIconProps>;
            antdIconCache[iconName] = Component;
            if (!cancelled) setIconComponent(Component);
          } catch (error) {
            console.error(
              `Error loading Ant Design icon "${iconName}":`,
              error,
            );
          }
        };
        loadIcon();
        return () => {
          cancelled = true;
        };
      }
    }, []);

    return IconComponent ? (
      <IconComponent {...props} />
    ) : (
      <LoadingOutlined spin className="flex justify-center items-center" />
    );
  });

  DynamicIconComponent.displayName = `DynamicIcon_${iconName}`;

  return DynamicIconComponent;
};
