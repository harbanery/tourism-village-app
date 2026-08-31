import { ArticleListSection } from "./section/ArticleListSection";
import { ArchiveSection } from "./section/ArchiveSection";

export default function ArticlePage() {
  return (
    <ArticleListSection>
      <ArchiveSection />
    </ArticleListSection>
  );
}
