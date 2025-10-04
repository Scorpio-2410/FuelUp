import React from "react";
import { View, ViewProps } from "react-native";

type Props = { children: React.ReactNode } & ViewProps;

export default function ProfileRow({ children, style, ...rest }: Props) {
  return (
    <View
      {...rest}
      className="flex-row items-center justify-between bg-gray-900/50 border border-gray-800/50 rounded-xl px-4 py-4 mb-5"
      style={style}>
      {children}
    </View>
  );
}
