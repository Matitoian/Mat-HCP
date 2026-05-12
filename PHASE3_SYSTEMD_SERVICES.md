# Phase 3 Worker Systemd Services

## Email Worker Service

Create file: `/etc/systemd/system/housecom-email-worker.service`

```ini
[Unit]
Description=HouseCom Email Worker
After=network.target rabbitmq-server.service
Requires=rabbitmq-server.service

[Service]
Type=simple
User=housecom
WorkingDirectory=/var/www/housecom
ExecStart=/usr/bin/php /var/www/housecom/backend/workers/EmailWorker.php
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="RABBITMQ_HOST=localhost"
Environment="RABBITMQ_PORT=5672"
Environment="RABBITMQ_USER=guest"
Environment="RABBITMQ_PASSWORD=guest"
SyslogIdentifier=housecom-email-worker

# Resource limits
MemoryLimit=512M
CPUQuota=50%

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

---

## SMS Worker Service

Create file: `/etc/systemd/system/housecom-sms-worker.service`

```ini
[Unit]
Description=HouseCom SMS Worker
After=network.target rabbitmq-server.service
Requires=rabbitmq-server.service

[Service]
Type=simple
User=housecom
WorkingDirectory=/var/www/housecom
ExecStart=/usr/bin/php /var/www/housecom/backend/workers/SMSWorker.php
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="RABBITMQ_HOST=localhost"
Environment="RABBITMQ_PORT=5672"
Environment="RABBITMQ_USER=guest"
Environment="RABBITMQ_PASSWORD=guest"
Environment="AFRICAS_TALKING_API_KEY=YOUR_API_KEY"
SyslogIdentifier=housecom-sms-worker

# Resource limits
MemoryLimit=256M
CPUQuota=25%

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

---

## Search Index Worker Service

Create file: `/etc/systemd/system/housecom-search-worker.service`

```ini
[Unit]
Description=HouseCom Search Index Worker
After=network.target elasticsearch.service rabbitmq-server.service
Requires=elasticsearch.service rabbitmq-server.service

[Service]
Type=simple
User=housecom
WorkingDirectory=/var/www/housecom
ExecStart=/usr/bin/php /var/www/housecom/backend/workers/SearchIndexWorker.php
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="RABBITMQ_HOST=localhost"
Environment="RABBITMQ_PORT=5672"
Environment="RABBITMQ_USER=guest"
Environment="RABBITMQ_PASSWORD=guest"
Environment="ELASTICSEARCH_HOST=localhost"
Environment="ELASTICSEARCH_PORT=9200"
SyslogIdentifier=housecom-search-worker

# Resource limits
MemoryLimit=768M
CPUQuota=50%

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

---

## Installation Instructions

### 1. Create housecom user (if not exists)
```bash
useradd -r -s /bin/false housecom
```

### 2. Create log directories
```bash
mkdir -p /var/log/housecom
chown housecom:housecom /var/log/housecom
chmod 755 /var/log/housecom
```

### 3. Copy service files
```bash
sudo cp /etc/systemd/system/housecom-*.service /etc/systemd/system/
sudo systemctl daemon-reload
```

### 4. Start services
```bash
# Start all three workers
sudo systemctl start housecom-email-worker
sudo systemctl start housecom-sms-worker
sudo systemctl start housecom-search-worker

# Enable auto-start on boot
sudo systemctl enable housecom-email-worker
sudo systemctl enable housecom-sms-worker
sudo systemctl enable housecom-search-worker
```

### 5. Verify services
```bash
# Check status
sudo systemctl status housecom-email-worker
sudo systemctl status housecom-sms-worker
sudo systemctl status housecom-search-worker

# View logs
journalctl -u housecom-email-worker -f
journalctl -u housecom-sms-worker -f
journalctl -u housecom-search-worker -f
```

---

## Worker Management Commands

### Start all workers
```bash
for service in housecom-email-worker housecom-sms-worker housecom-search-worker; do
  sudo systemctl start $service
done
```

### Stop all workers
```bash
for service in housecom-email-worker housecom-sms-worker housecom-search-worker; do
  sudo systemctl stop $service
done
```

### Restart all workers
```bash
for service in housecom-email-worker housecom-sms-worker housecom-search-worker; do
  sudo systemctl restart $service
done
```

### Check worker status
```bash
systemctl status housecom-*-worker | grep -E 'Active|Sub'
```

### View real-time logs
```bash
# All workers
journalctl -u "housecom-*-worker" -f

# Specific worker
journalctl -u housecom-email-worker -f --no-pager -n 100
```

### Monitor queue depth
```bash
# Check RabbitMQ queue sizes
rabbitmqctl list_queues name messages messages_ready messages_unacknowledged

# Check file-based queues
ls -lh /tmp/housecom_*_queue.json
wc -l /tmp/housecom_*_queue.json
```

---

## Health Check Scripts

### Email Worker Health
```bash
#!/bin/bash
if systemctl is-active --quiet housecom-email-worker; then
  echo "✓ Email worker is running"
  QUEUE_SIZE=$(redis-cli LLEN email_queue 2>/dev/null || echo "N/A")
  echo "  Queue size: $QUEUE_SIZE"
else
  echo "✗ Email worker is NOT running"
  exit 1
fi
```

### SMS Worker Health
```bash
#!/bin/bash
if systemctl is-active --quiet housecom-sms-worker; then
  echo "✓ SMS worker is running"
  QUEUE_SIZE=$(redis-cli LLEN sms_queue 2>/dev/null || echo "N/A")
  echo "  Queue size: $QUEUE_SIZE"
else
  echo "✗ SMS worker is NOT running"
  exit 1
fi
```

### Search Worker Health
```bash
#!/bin/bash
if systemctl is-active --quiet housecom-search-worker; then
  echo "✓ Search worker is running"
  QUEUE_SIZE=$(redis-cli LLEN search_queue 2>/dev/null || echo "N/A")
  echo "  Queue size: $QUEUE_SIZE"
  
  # Check Elasticsearch connectivity
  curl -s http://localhost:9200/_cluster/health | grep -q "green\|yellow" && echo "  Elasticsearch: OK" || echo "  Elasticsearch: FAIL"
else
  echo "✗ Search worker is NOT running"
  exit 1
fi
```

### Run all health checks
```bash
bash email_worker_health.sh
bash sms_worker_health.sh
bash search_worker_health.sh
```

---

## Troubleshooting

### Worker won't start
```bash
# Check syntax errors
php -l backend/workers/EmailWorker.php

# Check permissions
ls -l backend/workers/
chmod +x backend/workers/*.php

# Check logs
journalctl -u housecom-email-worker -n 50
```

### RabbitMQ connection error
```bash
# Check RabbitMQ status
sudo systemctl status rabbitmq-server

# Check RabbitMQ connectivity
telnet localhost 5672

# Check RabbitMQ management UI
http://localhost:15672 (default: guest/guest)
```

### High memory usage
```bash
# Check worker memory usage
systemctl status housecom-email-worker | grep Memory
ps aux | grep housecom-email-worker

# Reduce memory limit in service file and reload
sudo systemctl daemon-reload
sudo systemctl restart housecom-email-worker
```

### Queue not processing
```bash
# Check queue exists
redis-cli LLEN email_queue

# Manually test processing
php -r "require 'backend/workers/EmailWorker.php'; echo 'Worker logic loaded successfully';"

# Check for stuck processes
ps aux | grep -E "EmailWorker|SMSWorker|SearchIndexWorker" | grep -v grep
```

---

## Production Deployment

### 1. Pre-deployment checklist
- [ ] All workers have been tested in development
- [ ] Environment variables configured (.env file)
- [ ] RabbitMQ credentials secure
- [ ] Elasticsearch cluster health: OK
- [ ] Database connections verified
- [ ] Redis cache available
- [ ] Log directories writable
- [ ] Systemd service files in place

### 2. Deployment steps
```bash
# 1. Deploy service files
sudo cp housecom-*.service /etc/systemd/system/

# 2. Reload systemd
sudo systemctl daemon-reload

# 3. Start workers
sudo systemctl start housecom-email-worker
sudo systemctl start housecom-sms-worker
sudo systemctl start housecom-search-worker

# 4. Verify running
sudo systemctl status housecom-*-worker

# 5. Monitor for 5 minutes
journalctl -u housecom-email-worker -f &
journalctl -u housecom-sms-worker -f &
journalctl -u housecom-search-worker -f &

# 6. Enable on boot
sudo systemctl enable housecom-email-worker
sudo systemctl enable housecom-sms-worker
sudo systemctl enable housecom-search-worker
```

### 3. Verification
```bash
# Check all workers active
sudo systemctl is-active housecom-*-worker

# Check no errors in logs
journalctl -u housecom-email-worker -S "10 minutes ago" | grep -i error
journalctl -u housecom-sms-worker -S "10 minutes ago" | grep -i error
journalctl -u housecom-search-worker -S "10 minutes ago" | grep -i error

# Test event publishing
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Verify events processed in logs
journalctl -u housecom-email-worker -n 10
```

---

## Monitoring Integration

### Prometheus Metrics (Optional)
Add to worker service:
```ini
[Service]
# ... existing config ...
ExecStart=/usr/bin/php /var/www/housecom/backend/workers/EmailWorker.php --prometheus-port=9091
```

### Datadog Integration (Optional)
```bash
# Install Datadog agent
DD_AGENT_MAJOR_VERSION=7 dd-agent-install-script.sh --api-key YOUR_API_KEY

# Add custom metrics
cat > /etc/datadog-agent/conf.d/housecom.yaml << EOF
logs:
  - type: file
    path: /var/log/housecom/email_worker.log
    source: housecom
    service: email-worker
  - type: file
    path: /var/log/housecom/sms_worker.log
    source: housecom
    service: sms-worker
EOF
```
