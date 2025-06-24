"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type SmartPaginationProps = {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
};

export default function SmartPagination({
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

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <Pagination className="mt-8 justify-center">
      <PaginationContent>
        {/* First */}
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationLink
              onClick={() => onPageChange(1)}
              aria-label="First page"
              className="flex items-center justify-center"
            >
              <ChevronsLeft className="w-4 h-4" />
            </PaginationLink>
          </PaginationItem>
        )}

        {/* Back */}
        <PaginationItem>
          <PaginationLink
            onClick={
              !isFirstPage ? () => onPageChange(currentPage - 1) : undefined
            }
            aria-label="Previous page"
            className={`flex items-center justify-center ${
              isFirstPage ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <ChevronLeft />
          </PaginationLink>
        </PaginationItem>

        {/* Pages */}
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

        {/* Forward */}
        <PaginationItem>
          <PaginationLink
            onClick={
              !isLastPage ? () => onPageChange(currentPage + 1) : undefined
            }
            aria-label="Next page"
            className={`flex items-center justify-center ${
              isLastPage ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <ChevronRight />
          </PaginationLink>
        </PaginationItem>

        {/* Last */}
        {currentPage < totalPages - 1 && (
          <PaginationItem>
            <PaginationLink
              onClick={() => onPageChange(totalPages)}
              aria-label="Last page"
              className="flex items-center justify-center"
            >
              <ChevronsRight className="w-4 h-4" />
            </PaginationLink>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
