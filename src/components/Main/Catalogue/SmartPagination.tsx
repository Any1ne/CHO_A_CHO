"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

type SmartPaginationProps = {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
};

export default function SmartPagination({
  //! FIX butons and positioning of element
  totalPages,
  currentPage,
  onPageChange,
}: SmartPaginationProps) {
  const visiblePages: number[] = [];

  if (totalPages <= 3) {
    for (let i = 1; i <= totalPages; i++) {
      visiblePages.push(i);
    }
  } else {
    const from = Math.max(1, currentPage - 1);
    const to = Math.min(totalPages, currentPage + 1);
    for (let i = from; i <= to; i++) {
      visiblePages.push(i);
    }
  }

  return (
    <Pagination className="mt-6">
      <PaginationContent>
        {/* Перехід на першу сторінку */}
        {currentPage > 2 && (
          <PaginationItem>
            <PaginationLink
              onClick={() => onPageChange(1)}
              aria-label="First page"
            >
              {"<<"}
            </PaginationLink>
          </PaginationItem>
        )}

        {/* Кнопка назад */}
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Previous page"
          />
        </PaginationItem>

        {/* Кнопки сторінок */}
        {visiblePages.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              isActive={currentPage === page}
              onClick={() => onPageChange(page)}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        {/* Кнопка вперед */}
        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Next page"
          />
        </PaginationItem>

        {/* Перехід на останню сторінку */}
        {currentPage < totalPages - 1 && (
          <PaginationItem>
            <PaginationLink
              onClick={() => onPageChange(totalPages)}
              aria-label="Last page"
            >
              {">>"}
            </PaginationLink>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
