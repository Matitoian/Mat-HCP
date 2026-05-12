<?php
/**
 * Admin Dashboard Statistics
 * GET /api/admin/dashboard-stats.php
 */

require_once '../../config/config.php';
require_once '../../models/User.php';
require_once '../../models/Property.php';
require_once '../../models/PaymentTransaction.php';
require_once '../../models/FraudReport.php';
require_once '../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed', 405);
}

// Authenticate admin
$auth = requireAdmin();

try {
    $database = new Database();
    $db = $database->getConnection();

    // Users statistics
    $userModel = new User($db);
    $totalUsers = $userModel->getTotalCount();
    $totalTenants = $userModel->getTotalCount(['role' => 'tenant']);
    $totalLandlords = $userModel->getTotalCount(['role' => 'landlord']);
    $verifiedUsers = $userModel->getTotalCount(['verified' => true]);

    // Properties statistics
    $propertyModel = new Property($db);
    $totalProperties = $propertyModel->getTotalCount();
    $activeProperties = $propertyModel->getTotalCount(['status' => 'active']);
    $pendingProperties = $propertyModel->getTotalCount(['status' => 'pending']);
    $verifiedProperties = $propertyModel->getTotalCount(['verified' => true]);

    // Payment statistics
    $paymentModel = new PaymentTransaction($db);
    $revenueStats = $paymentModel->getRevenueStats();

    // Fraud reports statistics
    $fraudModel = new FraudReport($db);
    $pendingReports = $fraudModel->getPendingCount();
    $reportsByStatus = $fraudModel->getCountByStatus();

    // Recent activity
    $recentPropertiesQuery = "SELECT id, title, county, created_at 
                              FROM properties 
                              ORDER BY created_at DESC 
                              LIMIT 5";
    $stmt = $db->prepare($recentPropertiesQuery);
    $stmt->execute();
    $recentProperties = $stmt->fetchAll();

    $recentUsersQuery = "SELECT id, full_name, email, role, created_at 
                         FROM users 
                         WHERE role != 'admin'
                         ORDER BY created_at DESC 
                         LIMIT 5";
    $stmt = $db->prepare($recentUsersQuery);
    $stmt->execute();
    $recentUsers = $stmt->fetchAll();

    jsonResponse([
        'success' => true,
        'data' => [
            'users' => [
                'total' => $totalUsers,
                'tenants' => $totalTenants,
                'landlords' => $totalLandlords,
                'verified' => $verifiedUsers
            ],
            'properties' => [
                'total' => $totalProperties,
                'active' => $activeProperties,
                'pending' => $pendingProperties,
                'verified' => $verifiedProperties
            ],
            'revenue' => [
                'total' => floatval($revenueStats['total_revenue'] ?? 0),
                'today' => floatval($revenueStats['today_revenue'] ?? 0),
                'week' => floatval($revenueStats['week_revenue'] ?? 0),
                'month' => floatval($revenueStats['month_revenue'] ?? 0),
                'transactions' => intval($revenueStats['total_transactions'] ?? 0)
            ],
            'fraudReports' => [
                'pending' => $pendingReports,
                'byStatus' => $reportsByStatus
            ],
            'recentActivity' => [
                'properties' => $recentProperties,
                'users' => $recentUsers
            ]
        ]
    ]);

} catch (Exception $e) {
    error_log("Admin dashboard stats error: " . $e->getMessage());
    errorResponse('Failed to fetch statistics', 500);
}
