const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'any',
  'do',
  'for',
  'i',
  'in',
  'is',
  'it',
  'me',
  'my',
  'of',
  'on',
  'or',
  'please',
  'show',
  'some',
  'the',
  'to',
  'under',
  'want',
  'with'
]);

export const normalizeSearchText = (value = '') => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const tokenizeSearch = (value = '') => {
  return normalizeSearchText(value)
    .split(' ')
    .filter((token) => token && !STOP_WORDS.has(token));
};

const splitIntoTerms = (value = '') => {
  return normalizeSearchText(value)
    .split(' ')
    .filter((token) => token && token.length > 1 && !STOP_WORDS.has(token));
};

const isSubsequenceMatch = (needle, haystack) => {
  if (!needle || !haystack) {
    return false;
  }

  let needleIndex = 0;

  for (let haystackIndex = 0; haystackIndex < haystack.length; haystackIndex += 1) {
    if (haystack[haystackIndex] === needle[needleIndex]) {
      needleIndex += 1;
    }

    if (needleIndex === needle.length) {
      return true;
    }
  }

  return false;
};

const getLevenshteinDistance = (left, right) => {
  if (left === right) {
    return 0;
  }

  if (!left.length) {
    return right.length;
  }

  if (!right.length) {
    return left.length;
  }

  const matrix = Array.from({ length: left.length + 1 }, () => new Array(right.length + 1).fill(0));

  for (let row = 0; row <= left.length; row += 1) {
    matrix[row][0] = row;
  }

  for (let column = 0; column <= right.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;

      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitutionCost
      );
    }
  }

  return matrix[left.length][right.length];
};

const getMaxDistance = (token) => {
  if (token.length <= 4) {
    return 1;
  }

  if (token.length <= 8) {
    return 2;
  }

  return 3;
};

const scoreTokenAgainstCandidate = (token, candidate) => {
  if (!token || !candidate) {
    return 0;
  }

  if (candidate === token) {
    return 28;
  }

  const minComparableLength = Math.min(candidate.length, token.length);

  if (minComparableLength >= 3 && (candidate.startsWith(token) || token.startsWith(candidate))) {
    return 22;
  }

  if (minComparableLength >= 3 && (candidate.includes(token) || token.includes(candidate))) {
    return 16;
  }

  const distance = getLevenshteinDistance(token, candidate);
  const maxDistance = getMaxDistance(token);
  if (distance <= maxDistance) {
    return 14 - (distance * 3);
  }

  if (token.length >= 4 && candidate.length >= 4 && isSubsequenceMatch(token, candidate)) {
    return 8;
  }

  return 0;
};

const getProductSearchData = (product) => {
  const name = normalizeSearchText(product.name);
  const keywords = Array.isArray(product.keywords)
    ? product.keywords.map((keyword) => normalizeSearchText(keyword))
    : [];
  const nameTerms = splitIntoTerms(name);
  const keywordTerms = keywords.flatMap((keyword) => splitIntoTerms(keyword));

  return {
    name,
    keywords,
    combined: `${name} ${keywords.join(' ')}`.trim(),
    nameTerms,
    keywordTerms,
    allTerms: [...nameTerms, ...keywordTerms]
  };
};

const scoreProduct = (product, searchText, searchTokens) => {
  const { name, keywords, combined, nameTerms, keywordTerms, allTerms } = getProductSearchData(product);

  if (!combined) {
    return 0;
  }

  let score = 0;

  if (searchText && name.includes(searchText)) {
    score += 30;
  }

  if (searchText && keywords.some((keyword) => keyword.includes(searchText))) {
    score += 20;
  }

  searchTokens.forEach((token) => {
    const bestNameTokenScore = Math.max(
      ...nameTerms.map((candidate) => scoreTokenAgainstCandidate(token, candidate)),
      0
    );
    const bestKeywordTokenScore = Math.max(
      ...keywordTerms.map((candidate) => scoreTokenAgainstCandidate(token, candidate)),
      0
    );
    const bestOverallTokenScore = Math.max(
      ...allTerms.map((candidate) => scoreTokenAgainstCandidate(token, candidate)),
      0
    );

    score += bestNameTokenScore;
    score += bestKeywordTokenScore;

    if (bestOverallTokenScore > 0) {
      score += 4;
    } else if (combined.includes(token)) {
      score += 2;
    }
  });

  const allTokensMatch = searchTokens.length > 0 && searchTokens.every((token) => (
    allTerms.some((candidate) => scoreTokenAgainstCandidate(token, candidate) > 0)
      || combined.includes(token)
  ));
  if (allTokensMatch) {
    score += 18;
  }

  return score;
};

export const rankProductsBySearch = (products, searchQuery) => {
  const searchText = normalizeSearchText(searchQuery);
  const searchTokens = tokenizeSearch(searchQuery);

  if (!searchText) {
    return products;
  }

  return products
    .map((product) => ({
      product,
      score: scoreProduct(product, searchText, searchTokens)
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.product.rating.count !== left.product.rating.count) {
        return right.product.rating.count - left.product.rating.count;
      }

      return left.product.priceCents - right.product.priceCents;
    })
    .map(({ product }) => product);
};
