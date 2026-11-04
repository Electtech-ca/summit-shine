// BASE_PATH serves the site under a sub-path, for example /portfolio/summit-shine on the
// ElectTech VPS (deploy/vps). Unset, the site is served from the root as before.
const basePath = (process.env.BASE_PATH ?? "").replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: basePath || undefined,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "utfs.io" }, // UploadThing
    ],
  },
};

export default nextConfig;
