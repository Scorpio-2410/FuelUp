import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";

const K_TOKEN = "fu_token";
type Dest = "/(tabs)/homepage" | "/authlogin";

export default function Index() {
  const [dest, setDest] = useState<Dest | null>(null);

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync(K_TOKEN);
      setDest(token ? "/(tabs)/homepage" : "/authlogin");
    })();
  }, []);

  if (!dest) return null;
  // Cast avoids TS complaining when route type cache hasn't updated yet
  return <Redirect href={dest as any} />;
}
