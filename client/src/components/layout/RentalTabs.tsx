import { Link, useRoute } from "wouter";

export default function RentalTabs() {
  const [isSearchActive] = useRoute("/search");
  const [isForYouActive] = useRoute("/for-you");
  const [isSavedActive] = useRoute("/saved");
  const [isToolsActive] = useRoute("/tools");
  const [isDocumentsActive] = useRoute("/documents");

  return (
    <div className="flex mb-6 border-b border-gray-200 overflow-x-auto">
      <Link href="/search">
        <div className={`flex items-center px-6 py-3 font-medium cursor-pointer whitespace-nowrap ${
          isSearchActive ? "text-primary border-b-2 border-primary" : "text-text-medium hover:text-primary"
        }`}>
          <span className="material-icons mr-2">search</span>
          Search
        </div>
      </Link>

      <Link href="/for-you">
        <div className={`flex items-center px-6 py-3 font-medium cursor-pointer whitespace-nowrap ${
          isForYouActive ? "text-primary border-b-2 border-primary" : "text-text-medium hover:text-primary"
        }`}>
          <span className="material-icons mr-2">recommend</span>
          For You
        </div>
      </Link>

      <Link href="/saved">
        <div className={`flex items-center px-6 py-3 font-medium cursor-pointer whitespace-nowrap ${
          isSavedActive ? "text-primary border-b-2 border-primary" : "text-text-medium hover:text-primary"
        }`}>
          <span className="material-icons mr-2">bookmarks</span>
          Saved
        </div>
      </Link>

      <Link href="/tools">
        <div className={`flex items-center px-6 py-3 font-medium cursor-pointer whitespace-nowrap ${
          isToolsActive ? "text-primary border-b-2 border-primary" : "text-text-medium hover:text-primary"
        }`}>
          <span className="material-icons mr-2">view_list</span>
          Tools
        </div>
      </Link>
      
      <Link href="/documents">
        <div className={`flex items-center px-6 py-3 font-medium cursor-pointer whitespace-nowrap ${
          isDocumentsActive ? "text-primary border-b-2 border-primary" : "text-text-medium hover:text-primary"
        }`}>
          <span className="material-icons mr-2">description</span>
          Documents
        </div>
      </Link>
    </div>
  );
}