"use client";

import { useState } from "react";
import { getAppAssetUrl } from "@/lib/storage/asset-url";

export function LoginBrand() {
  const [lightFailed, setLightFailed] = useState(false);
  const [darkFailed, setDarkFailed] = useState(false);
  const lightLogoSrc = getAppAssetUrl("logo_caisse.svg");
  const darkLogoSrc = getAppAssetUrl("logo-light.svg");

  const bothFailed = lightFailed && darkFailed;

  if (bothFailed) {
    return (
      <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
        Caisse
      </span>
    );
  }

  return (
    <>
      {!lightFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={lightLogoSrc}
          alt="Caisse logo"
          width={142}
          height={40}
          className="h-9 w-auto object-contain dark:hidden"
          onError={() => setLightFailed(true)}
        />
      ) : null}
      {!darkFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={darkLogoSrc}
          alt="Caisse logo"
          width={142}
          height={40}
          className="hidden h-9 w-auto object-contain dark:block"
          onError={() => setDarkFailed(true)}
        />
      ) : null}
    </>
  );
}
