export default defineEventHandler(async (event) => {
  const user = await verifyAuth(event);

  const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isOwner =
    allowedEmails.length > 0 &&
    allowedEmails.includes((user.email ?? "").toLowerCase());

  return { data: { isOwner } };
});
