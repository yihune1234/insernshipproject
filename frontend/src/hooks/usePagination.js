import { useState } from 'react';
import { PAGE_SIZE } from '../utils/constants';

const usePagination = (pageSize = PAGE_SIZE) => {
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / pageSize);

  const reset = () => setPage(1);
  const next = () => setPage((p) => Math.min(p + 1, totalPages));
  const prev = () => setPage((p) => Math.max(p - 1, 1));

  return { page, setPage, total, setTotal, totalPages, pageSize, reset, next, prev };
};

export default usePagination;
