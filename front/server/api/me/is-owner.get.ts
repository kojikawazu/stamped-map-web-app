export default defineEventHandler(async (event) => {
  const user = await verifyAuth(event);

  const allowedEmails = getAllowedEmails();

  const isOwner =
    allowedEmails.length > 0 &&
    allowedEmails.includes((user.email ?? "").toLowerCase());

  return { data: { isOwner } };
});
