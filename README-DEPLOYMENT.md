# Deployment Guide - Flexible Infrastructure

This application supports multiple deployment scenarios and is not locked into Supabase. You can deploy it with different infrastructure providers based on your needs.

## Architecture Overview

```
Frontend (React + TypeScript)
    ↓ API Calls
Backend Services Layer
    ├── Auth (Supabase/Keycloak/Auth0)
    ├── API (Node.js + Prisma/PostgREST)
    └── Storage (Supabase/MinIO/S3/Azure)
    ↓
Database (PostgreSQL/MySQL)
```

## Deployment Scenarios

### Scenario 1: Full Supabase (Easiest)
- **Auth**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **API**: Supabase PostgREST

**Environment Variables:**
```bash
VITE_AUTH_PROVIDER=supabase
VITE_DB_PROVIDER=supabase
VITE_STORAGE_PROVIDER=supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-key
```

### Scenario 2: Self-Hosted with Docker (Full Control)
- **Auth**: Keycloak
- **Database**: PostgreSQL
- **Storage**: MinIO
- **API**: PostgREST + Custom Node.js

**Setup:**
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Configure environment
cp .env.example .env.dev
```

**Environment Variables:**
```bash
VITE_AUTH_PROVIDER=keycloak
VITE_DB_PROVIDER=postgresql
VITE_STORAGE_PROVIDER=minio
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=etr-ml
VITE_KEYCLOAK_CLIENT_ID=etr-ml-frontend
VITE_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/etrml
VITE_STORAGE_ENDPOINT=http://localhost:9000
VITE_API_URL=http://localhost:4000/api
```

### Scenario 3: Cloud Hybrid (Scalable)
- **Auth**: Auth0/Keycloak
- **Database**: Managed PostgreSQL (AWS RDS, Google Cloud SQL)
- **Storage**: Cloud Storage (S3, Azure Blob, GCS)
- **API**: Serverless Functions + Node.js

**Environment Variables:**
```bash
VITE_AUTH_PROVIDER=auth0
VITE_DB_PROVIDER=postgresql
VITE_STORAGE_PROVIDER=s3
VITE_DATABASE_URL=postgresql://user:pass@host:5432/db
VITE_STORAGE_ENDPOINT=https://s3.amazonaws.com
VITE_STORAGE_BUCKET=your-bucket
VITE_API_URL=https://your-api.com/api
```

### Scenario 4: Enterprise On-Premise
- **Auth**: Corporate LDAP/AD via Keycloak
- **Database**: On-premise PostgreSQL cluster
- **Storage**: Corporate file storage/NAS
- **API**: Internal Node.js services

## Configuration Files

### For Development
Use `.env.dev` or modify `.env` with:
- Local Docker services
- Development endpoints
- Debug settings

### For Production
Use `.env.prod` with:
- Production endpoints
- Secure secrets
- Production optimizations

## Provider-Specific Setup

### Supabase Setup
1. Create project at supabase.com
2. Get URL and anon key
3. Configure authentication providers
4. Set up storage buckets

### Keycloak Setup
1. Run Keycloak container
2. Create realm and client
3. Configure authentication flows
4. Set up user federation (LDAP/AD)

### MinIO Setup
1. Run MinIO container
2. Create access credentials
3. Configure buckets
4. Set up policies

### PostgreSQL Setup
1. Install PostgreSQL
2. Create database and user
3. Run migrations
4. Configure connection pooling

## Migration Between Providers

The application architecture allows you to migrate between providers:

1. **Auth Migration**: Change `VITE_AUTH_PROVIDER` and update config
2. **Database Migration**: Export/import data, update connection string
3. **Storage Migration**: Transfer files, update provider config

## Security Considerations

- Use HTTPS in production
- Secure environment variables
- Implement proper CORS settings
- Use strong JWT secrets
- Regular security updates
- Backup strategies

## Monitoring and Logging

Each provider offers different monitoring options:
- **Supabase**: Built-in dashboard
- **Docker**: Container logs
- **Cloud**: Provider-specific monitoring
- **Custom**: Implement logging middleware

## Performance Optimization

- Database indexing
- CDN for static assets
- Connection pooling
- Caching strategies
- Load balancing

## Support Matrix

| Feature | Supabase | Self-Hosted | Cloud | Enterprise |
|---------|----------|-------------|-------|------------|
| Auth | ✅ | ✅ | ✅ | ✅ |
| Database | ✅ | ✅ | ✅ | ✅ |
| Storage | ✅ | ✅ | ✅ | ✅ |
| Real-time | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Functions | ✅ | ⚠️ | ✅ | ⚠️ |

✅ Fully Supported | ⚠️ Requires Additional Setup