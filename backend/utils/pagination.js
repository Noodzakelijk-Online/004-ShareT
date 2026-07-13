const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizePagination(query = {}, total = 0) {
  const limit = Math.min(
    positiveInteger(query.limit, DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE
  );
  const pages = Math.max(1, Math.ceil(total / limit));
  const requestedPage = positiveInteger(query.page, 1);
  const page = Math.min(requestedPage, pages);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    pages,
  };
}

module.exports = {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  normalizePagination,
};
