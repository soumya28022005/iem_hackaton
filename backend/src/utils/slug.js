function slugify(value) {
  return String(value || 'workspace')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'workspace';
}

async function uniqueSlug(prisma, base) {
  const root = slugify(base);
  let candidate = root;
  let index = 1;

  while (await prisma.workspace.findUnique({ where: { slug: candidate } })) {
    index += 1;
    candidate = `${root}-${index}`;
  }

  return candidate;
}

module.exports = {
  slugify,
  uniqueSlug,
};
