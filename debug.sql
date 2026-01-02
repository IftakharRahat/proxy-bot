SELECT ps.id, u.username, ps.status, ps."portId", p.port
FROM "ProxySession" ps
JOIN "User" u ON ps."userId" = u.id
JOIN "Port" p ON ps."portId" = p.id
ORDER BY ps."createdAt" DESC
LIMIT 10;
