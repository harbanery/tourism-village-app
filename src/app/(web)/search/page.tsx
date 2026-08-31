import { SearchResultsSection } from "./section/SearchResultsSection";
import { SearchSidebarSection } from "./section/SearchSidebarSection";
import { dummyBlogs } from "@/models";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { keyword, date } = await searchParams;

  const query = typeof keyword === "string" ? keyword.toLowerCase() : "";
  const dateQuery = typeof date === "string" ? date : "";

  const results = dummyBlogs.filter((post) => {
    if (dateQuery) return post.datetime.startsWith(dateQuery);
    if (query) return post.title.toLowerCase().includes(query);
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 lg:grid-cols-[1fr_300px]">
      <SearchResultsSection results={results} query={query} dateQuery={dateQuery} />
      <SearchSidebarSection />
    </div>
  );
}
