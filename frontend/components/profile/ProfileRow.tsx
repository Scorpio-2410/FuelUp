import React from "react";
import { View, ViewProps } from "react-native";

type Props = { children: React.ReactNode } & ViewProps;

export default function ProfileRow({ children, style, ...rest }: Props) {
  return (
    <View
      {...rest}
      className="flex-row items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-3 mb-4"
      style={style}>
      {children}
    </View>
  );
}
