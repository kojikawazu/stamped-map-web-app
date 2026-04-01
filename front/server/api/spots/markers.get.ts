export default defineEventHandler(async (event) => {
  await verifyAuth(event);

  const query = getQuery(event) as Record<string, string>;
  const where = buildSpotWhereClause(query);

  const spots = await prisma.mapSpot.findMany({
    where,
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      categoryId: true,
      category: { select: { color: true } },
    },
  });

  return { data: spots.map(formatMarkerResponse) };
});
