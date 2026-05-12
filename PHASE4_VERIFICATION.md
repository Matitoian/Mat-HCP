# Phase 4 Implementation Verification

## Elasticsearch Search Integration

### 1. Setup Elasticsearch
```bash
# Already running via docker-compose
docker-compose ps | grep elasticsearch

# Verify connectivity
curl http://localhost:9200/_cluster/health
```

### 2. Create Property Index
```php
<?php
require_once 'backend/utils/ElasticsearchClient.php';

$es = new ElasticsearchClient();
$es->createIndex('properties_2026-03');
?>
```

### 3. Index Existing Properties
```php
<?php
$es = new ElasticsearchClient();

// Get all properties from database
$db = Database::getInstance();
$stmt = $db->query("SELECT * FROM properties WHERE verified = true LIMIT 1000");
$properties = $stmt->fetchAll();

// Bulk index
$result = $es->bulkIndex($properties);
echo "Indexed " . count($properties) . " properties\n";
?>
```

### 4. Test Search Functionality
```bash
# Full-text search
curl -X GET "localhost:9200/properties_2026-03/_search?pretty" -H 'Content-Type: application/json' -d'{
  "query": {
    "multi_match": {
      "query": "apartment Mombasa",
      "fields": ["title", "description", "county"]
    }
  }
}'

# Geo-spatial search (nearby)
curl -X GET "localhost:9200/properties_2026-03/_search?pretty" -H 'Content-Type: application/json' -d'{
  "query": {
    "bool": {
      "must": [
        {"match": {"county": "Mombasa"}}
      ],
      "filter": [
        {
          "geo_distance": {
            "distance": "5km",
            "location": {"lat": -4.04, "lon": 39.66}
          }
        }
      ]
    }
  }
}'
```

---

## Database Sharding by County

### 1. Create Shard Databases
```bash
# Create 4 PostgreSQL instances
docker-compose up -d db-mombasa db-kilifi db-kwale db-lamu

# Initialize schemas
for shard in mombasa kilifi kwale lamu; do
  PGPASSWORD=$DB_PASSWORD psql -h db-$shard -U $DB_USER -d housecom_$shard < backend/database/schema.sql
done
```

### 2. Configure Shard Connections
```php
// In config/config.php
define('SHARD_CONFIG', [
    'mombasa' => [
        'host' => getenv('DB_SHARD_MOMBASA_HOST'),
        'port' => 5432,
        'db' => 'housecom_mombasa'
    ],
    'kilifi' => [
        'host' => getenv('DB_SHARD_KILIFI_HOST'),
        'port' => 5432,
        'db' => 'housecom_kilifi'
    ],
    'kwale' => [
        'host' => getenv('DB_SHARD_KWALE_HOST'),
        'port' => 5432,
        'db' => 'housecom_kwale'
    ],
    'lamu' => [
        'host' => getenv('DB_SHARD_LAMU_HOST'),
        'port' => 5432,
        'db' => 'housecom_lamu'
    ]
]);
```

### 3. Test Sharding
```php
<?php
require_once 'backend/utils/ShardManager.php';

$shardMgr = new ShardManager();

// Test property insertion (auto-routes to correct shard)
$property = [
    'user_id' => 1,
    'title' => 'Beachfront Apartment',
    'description' => 'Beautiful sea view',
    'county' => 'Mombasa',
    'price' => 25000,
    'bedrooms' => 2,
    'bathrooms' => 2,
    'latitude' => -4.04,
    'longitude' => 39.66,
    'verified' => true
];

$result = $shardMgr->insertProperty($property);
echo "Property inserted in shard: " . $result['shard'] . "\n";

// Test geo-spatial search
$nearby = $shardMgr->searchNearby(-4.04, 39.66, 5, 20);
echo "Found " . count($nearby) . " properties nearby\n";

// Check shard statistics
$stats = $shardMgr->getShardStats();
print_r($stats);
?>
```

---

## Fraud Detection System

### 1. Setup Fraud Detection Tables
```sql
CREATE TABLE IF NOT EXISTS fraud_reports (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (transaction_id) REFERENCES payment_transactions(id)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS fraud_report_count INT DEFAULT 0;
```

### 2. Test Fraud Scoring
```php
<?php
require_once 'backend/utils/FraudDetector.php';

$detector = new FraudDetector();

$transaction = [
    'user_id' => 1,
    'amount' => 50000,
    'device_fingerprint' => 'device_abc123',
    'latitude' => -4.04,
    'longitude' => 39.66
];

$result = $detector->scoreTransaction($transaction);
echo "Risk Score: " . $result['risk_score'] . "\n";
echo "Is Suspicious: " . ($result['is_suspicious'] ? 'YES' : 'NO') . "\n";
echo "Recommendation: " . $result['recommendation'] . "\n";
echo "Indicators: " . implode(', ', $result['indicators']) . "\n";
?>
```

### 3. Monitor Fraud Patterns
```bash
# Check high-risk transactions
curl http://localhost/api/admin/fraud-stats

# View fraud reports
curl http://localhost/api/admin/fraud-reports
```

---

## ML Recommendation Engine

### 1. Deploy Python ML Service
```bash
# Create Python service
cat > backend/ml/requirements.txt << EOF
flask==2.3.0
pandas==2.0.0
scikit-learn==1.2.0
redis==4.5.0
EOF

pip install -r backend/ml/requirements.txt

# Start ML service (runs on port 5000)
python backend/ml/recommendation_service.py &
```

### 2. Configure Recommendation Settings
```php
// In config/config.php
define('ML_SERVICE_URL', 'http://localhost:5000');
define('ML_RECOMMENDATION_LIMIT', 10);
define('ML_TRENDING_UPDATE_INTERVAL', 3600); // 1 hour
```

### 3. Test Recommendations
```bash
# Get personalized recommendations
curl http://localhost/api/recommendations/user/1

# Get trending properties
curl http://localhost/api/trending?county=Mombasa

# Get similar properties
curl http://localhost/api/properties/123/similar

# Trigger model retraining
curl -X POST http://localhost/api/admin/retrain-model
```

### 4. Track User Interactions
```php
<?php
require_once 'backend/utils/RecommendationEngine.php';

$recommender = new RecommendationEngine();

// Log user viewing a property
$recommender->trackInteraction(1, 123, 'view');

// Log user favoriting a property
$recommender->trackInteraction(1, 456, 'favorite');

// Log user inquiring about property
$recommender->trackInteraction(1, 789, 'inquire');
?>
```

---

## Performance Validation

### 1. Search Performance
```bash
# Test Elasticsearch query performance
time curl -X POST "localhost:9200/properties_2026-03/_search" \
  -H 'Content-Type: application/json' \
  -d '{"query":{"match_all":{}}}'
# Expected: <100ms for 1000 properties
```

### 2. Shard Query Performance
```bash
# Test shard query latency
php -r "
require_once 'backend/utils/ShardManager.php';
\$start = microtime(true);
\$shardMgr = new ShardManager();
\$results = \$shardMgr->searchNearby(-4.04, 39.66, 5, 20);
\$time = (microtime(true) - \$start) * 1000;
echo 'Query time: ' . round(\$time, 2) . 'ms\n';
"
# Expected: <200ms per shard
```

### 3. Fraud Detection Performance
```bash
# Test fraud scoring latency
php -r "
require_once 'backend/utils/FraudDetector.php';
\$detector = new FraudDetector();
\$start = microtime(true);
\$result = \$detector->scoreTransaction(['user_id' => 1, 'amount' => 50000]);
\$time = (microtime(true) - \$start) * 1000;
echo 'Fraud check time: ' . round(\$time, 2) . 'ms\n';
"
# Expected: <50ms
```

### 4. Recommendation Generation
```bash
# Test recommendation latency
curl -w "Time: %{time_total}s\n" http://localhost/api/recommendations/user/1
# Expected: <200ms (cached), <1s (fresh)
```

---

## Monitoring & Alerts

### 1. Elasticsearch Health
```bash
# Monitor cluster health
curl http://localhost:9200/_cluster/health

# Monitor index size
curl http://localhost:9200/_cat/indices?v
```

### 2. Shard Replication Status
```php
<?php
require_once 'backend/utils/ShardManager.php';

$shardMgr = new ShardManager();
$status = $shardMgr->monitorReplication();

foreach ($status as $shard => $info) {
    echo "$shard: {$info['lag_seconds']} seconds lag\n";
}
?>
```

### 3. Fraud Detection Alerts
```sql
-- Query high-risk transactions
SELECT user_id, COUNT(*) as risk_count
FROM fraud_reports
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id
HAVING COUNT(*) > 5
ORDER BY risk_count DESC;
```

### 4. Recommendation Model Performance
```bash
# Check model accuracy metrics
curl http://localhost:5000/api/stats

# View model retraining logs
tail -f /var/log/housecom/ml_service.log
```

---

## Deployment Checklist

- [ ] Elasticsearch cluster initialized
- [ ] All property indices created (monthly rotation)
- [ ] Properties bulk-indexed successfully
- [ ] Search queries returning <100ms latency
- [ ] 4 Shard databases created and initialized
- [ ] ShardManager routing verified by county
- [ ] Geo-spatial search queries tested
- [ ] Fraud detection tables created
- [ ] Fraud scorer responding <50ms
- [ ] ML service running on port 5000
- [ ] Recommendation engine caching working
- [ ] User interactions being tracked
- [ ] Model retraining scheduled daily
- [ ] All monitoring dashboards operational
- [ ] Alert thresholds configured

---

## Performance Targets

| Metric | Target | Achieved |
|--------|--------|----------|
| Search Query | <100ms | |
| Geo-spatial Query | <200ms | |
| Fraud Check | <50ms | |
| Recommendations | <200ms (cached) | |
| Recommendations | <1s (fresh) | |
| Shard Query | <200ms | |
| Replica Lag | <1s | |
