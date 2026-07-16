export interface ParsedDbUrl {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
}

/** Parsea una DATABASE_URL de Postgres en sus componentes, para invocar pg_dump/psql. */
export const parseDbUrl = (databaseUrl: string): ParsedDbUrl => {
  const url = new URL(databaseUrl);
  return {
    host: url.hostname,
    port: url.port || '5432',
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
  };
};
