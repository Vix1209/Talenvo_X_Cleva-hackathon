export interface PaginationData<T> {
  data: T[];
  meta: {
    limit: number;
    currentPage: number;
    lastPage: number;
    totalPages?: number;
  };
}

export function paginate<T>(
  array: T[],
  size: number,
  page: number,
  totalPages?: number,
): PaginationData<T> {
  let data: T[];
  if (size * (page - 1) > array.length) data = [];
  else
    data = array.slice(size * (page - 1), Math.min(size * page, array.length));
  let lastPage = Math.ceil(array.length / size);

  // let previousPage = page - 1;
  // let nextPage = page + 1 > lastPage ? 0 : page + 1;
  return {
    data,
    meta: {
      limit: size,
      currentPage: page,
      lastPage,
      totalPages,
    },
  };
}
