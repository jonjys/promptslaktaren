import { MetadataRoute } from "next";
import { POPULAR_WORDS } from "@/lib/prompt-template";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://promptslaktaren.se";

  const wordPages = POPULAR_WORDS.map((word) => ({
    url: `${base}/${word}-app-prompt`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...wordPages,
  ];
}
