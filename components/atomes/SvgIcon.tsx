import React from "react";
import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  ViewStyle,
} from "react-native";
import { SvgProps } from "react-native-svg";

type SvgComponent = React.FC<SvgProps>;

type SvgIconProps = {
  Icon: SvgComponent | ImageSourcePropType;
  size?: number;
  color?: string;
  style?: ViewStyle;
};

export default function SvgIcon({
  Icon,
  size = 26,
  color,
  style,
}: SvgIconProps) {
  // 1) SVG importé comme composant (native via transformer)
  if (typeof Icon === "function") {
    const Comp = Icon as SvgComponent;
    return (
      <Comp
        width={size}
        height={size}
        style={style as any}
        fill={color}
        color={color}
        stroke={color}
      />
    );
  }

  // 2) SVG importé comme module avec .default (certains toolchains web)
  if (
    Icon &&
    typeof Icon === "object" &&
    typeof (Icon as any).default === "function"
  ) {
    const Comp = (Icon as any).default as SvgComponent;
    return (
      <Comp
        width={size}
        height={size}
        fill={color}
        color={color}
        stroke={color}
        style={style as any}
      />
    );
  }

  // 3) Fallback image: number (require), { uri }, ou string (URL web)
  const imageSource: ImageSourcePropType | { uri: string } =
    typeof Icon === "string" ? { uri: Icon } : (Icon as ImageSourcePropType);

  return (
    <Image
      source={imageSource as ImageSourcePropType}
      style={{ width: size, height: size, tintColor: color } as ImageStyle}
      resizeMode="contain"
    />
  );
}
