# MySQL connection notes

The project is connected to MySQL through `mysql2/promise` in `db/index.ts`.

Required environment variables:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `ADMIN_SESSION_SECRET`

Admin passwords must be stored as `scrypt:` hashes. Generate one with:

```bash
npm run admin:hash-password -- "replace-with-a-long-password"
```

Then insert it into `admins.password_hash`.

The live API surface is:

- `GET /api/services`
- `POST /api/bookings`
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/me`
- `GET / PUT /api/admin/services`
- `GET / PUT /api/admin/settings`
