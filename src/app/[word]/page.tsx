import { redirect } from "next/navigation";

/** Old PromptSlaktaren SEO pages → home */
export default function WordPage() {
  redirect("/");
}
