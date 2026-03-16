function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "");
}

function trimLeadingSlashes(value: string) {
  return value.replace(/^\/+/, "");
}

export function getAppAssetUrl(assetPath: string) {
  const normalizedAssetPath = trimLeadingSlashes(assetPath);
  const baseUrl = trimTrailingSlashes(process.env.NEXT_PUBLIC_APP_ASSETS_BASE_URL || "");
  if (!baseUrl) {
    return `/api/app-assets/${normalizedAssetPath}`;
  }
  return `${baseUrl}/${normalizedAssetPath}`;
}
