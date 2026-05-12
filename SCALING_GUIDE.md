# HouseCom Scaling Architecture for 2.5M Concurrent Users

## Current Problem: "Email Rate Limit Exceeded"

**What it means**: Supabase Auth limits signup attempts per email to prevent brute force attacks
- Max: ~3 signup attempts per email per hour
- Applies globally, not per user

**Solution for 2.5M users**:
1. ✅ Better error handling (just added)
2. Need comprehensive infrastructure upgrade

---

## Production Architecture for 2.5M Concurrent Users

### Phase 1: Immediate Fixes (Current)
- ✅ Rate limit error handling
- ✅ Supabase Auth configured
- ✅ SMS verification ready

### Phase 2: Short Term (1-3 months)

#### Database Optimization
```bash
# 1. Connection Pooling (PgBouncer)
- Max connections: 10,000+ (Supabase handles this)
- Use Supabase's built-in connection pooling

# 2. Database Indexes (Add to schema)
- ✅ Already indexed in schema.sql (email, role, verified, etc.)

# 3. Replication
- Set up read replicas for reporting/analytics
- CDN for static assets (Cloudflare)
```

#### Caching Layer
```bash
# Add Redis for caching
- User sessions: 1-day TTL
- Property listings: 1-hour TTL
- Chat messages: 24-hour cache
- OTP codes: 10-minute TTL

# Implementation: nginx + Redis
```

#### Load Balancing
```bash
# Multiple server instances behind load balancer
- Use Nginx or HAProxy
- Health checks every 5 seconds
- Sticky sessions for chat continuity
```

### Phase 3: Medium Term (3-6 months)

#### Microservices Architecture
```
HouseCom Microservices:
├── Auth Service (Supabase)
├── Property Service (PostgreSQL)
├── Chat Service (Redis Streams + PostgreSQL)
├── Payment Service (Stripe/M-Pesa + PostgreSQL)
├── SMS Service (Africa's Talking)
├── Search Service (Elasticsearch)
├── Analytics Service (BigQuery)
└── Notification Service (Firebase Cloud Messaging)
```

#### Message Queue
```bash
# For async processing (signup, email, SMS)
- Use RabbitMQ or Kafka
- Decouples services
- Handles 100k+ msgs/second
```

#### Search Optimization
```bash
# For property search at scale
- Elasticsearch cluster (3+ nodes)
- Handles filtering: county, price, bedrooms, distance
- Full-text search on descriptions
```

### Phase 4: Advanced (6+ months)

#### Content Delivery
```bash
# CDN Strategy
- Cloudflare for images/static content
- Regional caching in East Africa
- 99.99% uptime SLA
```

#### Database Sharding
```bash
# If PostgreSQL exceeds capacity
- Shard by county (Mombasa, Kilifi, Kwale, Lamu)
- Shard by user ID ranges
- Each shard separate PostgreSQL instance
```

#### AI/ML Services
```bash
# For recommendations at scale
- Property recommendations: Vector DB (Pinecone)
- Fraud detection: TensorFlow model
- Price optimization: Time series forecasting
```

---

## Recommended Stack for 2.5M Concurrent Users

```
Frontend: React + Vite (✅ Current)
├── Web: Hosted on Vercel/Netlify (auto-scaling)
├── Mobile: React Native with Expo
└── CDN: Cloudflare (global)

Backend: Node.js/Go microservices (Kubernetes)
├── API Gateway: Kong or AWS API Gateway
├── Auth: Supabase (handles 100M+ users)
├── Database: PostgreSQL (Supabase Pro tier)
├── Cache: Redis Cluster (6+ nodes)
├── Queue: RabbitMQ or Kafka
├── Search: Elasticsearch
└── Monitoring: Prometheus + Grafana

External Services:
├── SMS: Africa's Talking (scales to millions)
├── Payments: Stripe + M-Pesa
├── Email: SendGrid (millions/day)
├── Storage: AWS S3 + CloudFront
└── Monitoring: Datadog or New Relic
```

---

## Capacity Planning for 2.5M Concurrent Users

### Database
```
Current: Supabase Starter (2GB)
Needed: Supabase Pro (≥100GB) + Read Replica

Users table: 2.5M rows ≈ 250MB
Properties table: ~500k rows ≈ 500MB
Messages: Stream in every hour ≈ 1TB/month

Total: 200GB+ disk space
Connections: Up to 10k simultaneous
Transactions/sec: 50k+ TPS
```

### Server Infrastructure
```
Concurrent users: 2.5M
Avg session memory: 1MB per user
Total RAM needed: 2.5TB

Solution: Kubernetes cluster
├── 100+ Node instances (8 vCPU, 16GB RAM each)
├── Auto-scaling based on load
├── Multi-region deployment
└── Failover strategy
```

### Network
```
Avg data per user: 1MB/hour
Total bandwidth: 2.5M MB/hour = 625 GB/hour
Cost: ~$0.10/GB = $62,500/hour (AWS)

Solution:
- CDN distribution (Cloudflare reduces by 60%)
- Efficient compression (gzip, brotli)
- API rate limiting
- Data optimization
```

### Cost Estimate (Monthly)

```
Component                          Cost
─────────────────────────────────────────
Supabase Pro tier                  $2,000
PostgreSQL replicas                $3,000
Redis Cluster (6 nodes)            $5,000
Kubernetes cluster (100 nodes)     $50,000
CDN (Cloudflare)                   $1,000
Elasticsearch                      $3,000
RabbitMQ/Kafka                     $2,000
SMS (Africa's Talking)             $1,000
Email service (SendGrid)           $500
Monitoring & logging               $1,000
─────────────────────────────────────────
Total baseline infrastructure      $69,500/month
+ support, backups, disaster recovery
─────────────────────────────────────────
Realistic total                    $100,000+/month
```

---

## Immediate Actions (Next 2 Weeks)

### 1. Increase Supabase Tier
```bash
# Current: Free/Starter
# Needed: Pro tier ($25/month)
- Handles 100M+ signups
- Better rate limits
- Production support
```

### 2. Setup Proper Error Handling
```typescript
// ✅ Already done in this commit
- Rate limit detection
- User feedback
- Retry logic
```

### 3. Add API Rate Limiting
```bash
# Protect your backend from abuse
- 100 requests/minute per IP
- 1000 requests/hour per user
- 10k requests/second global limit
```

### 4. Monitoring & Alerting
```bash
# Track performance
- Sentry for error tracking
- Datadog/New Relic for APM
- Uptime monitoring (Pingdom)
```

### 5. Database Backup Strategy
```bash
# Critical for retention of data
- Daily backups to S3
- Point-in-time recovery (30 days)
- Cross-region replication
```

---

## Implementation Timeline

| Phase | Timeline | Goal | Investment |
|-------|----------|------|-----------|
| Phase 1 (Current) | Now | Error handling, basic setup | $500/month |
| Phase 2 | 1-3 months | Handle 50k concurrent | $10k/month |
| Phase 3 | 3-6 months | Handle 500k concurrent | $50k/month |
| Phase 4 | 6-12 months | Handle 2.5M concurrent | $100k+/month |

---

## Quick Wins (Do Now)

1. ✅ **Rate limit handling** - Added to authService
2. **Caching** - Add Redis for sessions (1 day to implement)
3. **CDN** - Cloudflare free tier for static assets (1 hour)
4. **Database indexes** - ✅ Already in schema
5. **Monitoring** - Add Sentry (2 hours)

---

## Next Steps

1. Upgrade Supabase to Pro tier
2. Add Redis caching layer
3. Set up Cloudflare CDN
4. Configure monitoring (Sentry/Datadog)
5. Load test with 10k+ concurrent users
6. Plan microservices migration

**Questions?** Let me know which phase to focus on first!
