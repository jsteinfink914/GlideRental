import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function RentalPagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const renderPageNumbers = () => {
    const pageNumbers = [];
    
    // Always show first page
    pageNumbers.push(
      <Button
        key={1}
        className={`w-10 h-10 rounded-lg ${currentPage === 1 ? 'bg-primary text-white' : 'border border-gray-200 hover:bg-secondary'}`}
        onClick={() => onPageChange(1)}
      >
        1
      </Button>
    );
    
    // If we're past page 3, show ellipsis after page 1
    if (currentPage > 3) {
      pageNumbers.push(
        <Button
          key="ellipsis1"
          className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-secondary"
          onClick={() => onPageChange(Math.max(1, currentPage - 5))}
        >
          ...
        </Button>
      );
    }
    
    // Show current page and adjacent pages
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last page as they're always shown
      
      pageNumbers.push(
        <Button
          key={i}
          className={`w-10 h-10 rounded-lg ${currentPage === i ? 'bg-primary text-white' : 'border border-gray-200 hover:bg-secondary'}`}
          onClick={() => onPageChange(i)}
        >
          {i}
        </Button>
      );
    }
    
    // If there are more pages after current + 1, show ellipsis
    if (currentPage < totalPages - 2) {
      pageNumbers.push(
        <Button
          key="ellipsis2"
          className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-secondary"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 5))}
        >
          ...
        </Button>
      );
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      pageNumbers.push(
        <Button
          key={totalPages}
          className={`w-10 h-10 rounded-lg ${currentPage === totalPages ? 'bg-primary text-white' : 'border border-gray-200 hover:bg-secondary'}`}
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </Button>
      );
    }
    
    return pageNumbers;
  };
  
  return (
    <div className="flex justify-center mt-8">
      <nav className="flex items-center gap-2">
        <Button
          className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-secondary"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <span className="material-icons">navigate_before</span>
        </Button>
        
        {renderPageNumbers()}
        
        <Button
          className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-secondary"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <span className="material-icons">navigate_next</span>
        </Button>
      </nav>
    </div>
  );
}
