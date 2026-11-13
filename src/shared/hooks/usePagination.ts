import { useState } from 'react';

export function usePagination(total: number, perPage = 20) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(total / perPage);
  const offset = (page - 1) * perPage;
  const limit = perPage;
  return {
    page, setPage, totalPages, offset, limit,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    prevPage: () => setPage((p) => Math.max(1, p - 1)),
    nextPage: () => setPage((p) => Math.min(totalPages, p + 1)),
  };
}
