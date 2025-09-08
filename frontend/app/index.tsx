import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function Index() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync("authToken");
      setAuthed(!!token);
      setReady(true);
    })();
  }, []);

  if (!ready) return null; // keep splash until check done

  return authed ? (
    <Redirect href="/(tabs)/homepage" />
  ) : (
    <Redirect href="/auth/login" />
  );
}
