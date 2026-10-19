<?php
/**
 * Manifest with Jaya — Member Portal & Recorded DMJ Sessions Backend API
 * Compatible with GoDaddy Web Hosting (cPanel Linux PHP 7.4 - 8.x)
 *
 * Provides:
 * - Paid student login validation
 * - 5-day expiration enforcement for recorded sessions
 * - Instructor Admin management (upload new session, replace weekly sessions, manage student roster)
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Instructor Passcode (can be changed by Jaya)
define('ADMIN_PASSCODE', 'jaya2026');

// Path to data file
$dataDir = __DIR__ . '/../data';
$dataFile = $dataDir . '/members_data.json';

// Ensure data directory exists
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

// Ensure .htaccess exists inside data directory
$htaccessFile = $dataDir . '/.htaccess';
if (!file_exists($htaccessFile)) {
    $htaccessContent = "# Deny direct access to data directory\n<IfModule mod_authz_core.c>\n    Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n    Order Allow,Deny\n    Deny from all\n</IfModule>\n";
    @file_put_contents($htaccessFile, $htaccessContent);
}

/**
 * Helper to calculate ISO date after N days
 */
function addDaysDate(int $days): string {
    return date('Y-m-d', strtotime("+{$days} days"));
}

/**
 * Default Seed Data (used on first install)
 */
function getInitialData(): array {
    $now = time();
    return [
        'members' => [
            [
                'email' => 'student@example.com',
                'name' => 'Priya Sharma',
                'enrolledDate' => date('Y-m-d', strtotime('-5 days')),
                'expiryDate' => addDaysDate(25),
                'status' => 'active'
            ],
            [
                'email' => 'client@example.com',
                'name' => 'Neha Reddy',
                'enrolledDate' => date('Y-m-d', strtotime('-15 days')),
                'expiryDate' => addDaysDate(15),
                'status' => 'active'
            ],
            [
                'email' => 'expired@example.com',
                'name' => 'Rohit Verma',
                'enrolledDate' => date('Y-m-d', strtotime('-60 days')),
                'expiryDate' => date('Y-m-d', strtotime('-5 days')),
                'status' => 'expired'
            ]
        ],
        'sessions' => [
            [
                'id' => 'session-1',
                'title' => 'Subconscious Reprogramming & Manifestation Resistance',
                'date' => 'Week of ' . date('M j, Y', strtotime('-1 days')),
                'duration' => '54 mins',
                'videoUrl' => 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
                'description' => 'In this week’s session, we uncover subconscious fears that masquerade as logic, and install empowering affirmations directly into the somatic field.',
                'takeaways' => [
                    'How to identify the subconscious fear keeping you in repetitive cycles.',
                    'Somatic EFT sequence for emotional neutralization before bedtime.',
                    'Guided Ho’oponopono forgiveness sequence for personal peace.'
                ],
                'createdAt' => date('c', $now - (1 * 86400)), // uploaded 1 day ago
                'expiresAt' => $now + (4 * 86400),           // 4 days remaining (total 5 days)
                'lifespanDays' => 5
            ],
            [
                'id' => 'session-2',
                'title' => 'Guided Morning Alignment & Energy Activation',
                'date' => 'Week of ' . date('M j, Y', strtotime('-2 days')),
                'duration' => '24 mins',
                'videoUrl' => 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
                'description' => 'A restorative 24-minute practice to ground your energy into confidence, gratitude, and expectant receiving.',
                'takeaways' => [
                    'Breathwork pacing for nervous system reset.',
                    'Heart-brain coherence meditation practice.',
                    'Daily intention setting prompt.'
                ],
                'createdAt' => date('c', $now - (2 * 86400)), // uploaded 2 days ago
                'expiresAt' => $now + (3 * 86400),           // 3 days remaining (total 5 days)
                'lifespanDays' => 5
            ]
        ]
    ];
}

/**
 * Load Database
 */
function loadData(string $file): array {
    if (!file_exists($file)) {
        $initial = getInitialData();
        saveData($file, $initial);
        return $initial;
    }

    $raw = @file_get_contents($file);
    if (!$raw) {
        return getInitialData();
    }

    $data = json_decode($raw, true);
    if (!is_array($data) || !isset($data['members']) || !isset($data['sessions'])) {
        return getInitialData();
    }

    return $data;
}

/**
 * Save Database
 */
function saveData(string $file, array $data): bool {
    return (bool) @file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

// Read incoming request
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$input = [];

if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        $input = json_decode($rawInput, true) ?: [];
    } else {
        $input = $_POST;
    }
} else {
    $input = $_GET;
}

$action = $input['action'] ?? 'status';

// -----------------------------------------------------------------------------
// ROUTE HANDLERS
// -----------------------------------------------------------------------------

switch ($action) {
    case 'status':
        echo json_encode([
            'ok' => true,
            'message' => 'Manifest with Jaya API is online and functional.',
            'version' => '1.0.0',
            'serverTime' => date('c'),
            'serverTimestamp' => time()
        ]);
        break;

    // 01. STUDENT LOGIN
    case 'login':
        $email = strtolower(trim($input['email'] ?? ''));
        if (empty($email)) {
            echo json_encode(['ok' => false, 'error' => 'Please provide an email address.']);
            exit;
        }

        $db = loadData($dataFile);
        $today = date('Y-m-d');
        $foundMember = null;

        foreach ($db['members'] as $m) {
            if (strtolower(trim($m['email'])) === $email) {
                $foundMember = $m;
                break;
            }
        }

        if (!$foundMember) {
            echo json_encode([
                'ok' => false,
                'reason' => 'not_found',
                'error' => "We could not find {$email} on the enrolled student list. Please enroll or contact Jaya."
            ]);
            exit;
        }

        // Check if subscription has expired
        if ($foundMember['expiryDate'] < $today) {
            echo json_encode([
                'ok' => false,
                'reason' => 'expired',
                'member' => $foundMember,
                'error' => "Your subscription expired on {$foundMember['expiryDate']}. Please renew to access this week's recordings."
            ]);
            exit;
        }

        // Process sessions with 5-day expiration check
        $now = time();
        $safeSessions = [];

        foreach ($db['sessions'] as $s) {
            $expiresAt = isset($s['expiresAt']) ? (int)$s['expiresAt'] : (strtotime($s['createdAt'] ?? 'now') + (5 * 86400));
            $isExpired = ($now >= $expiresAt);
            $remainingSeconds = max(0, $expiresAt - $now);

            $safeSession = [
                'id' => $s['id'],
                'title' => $s['title'],
                'date' => $s['date'],
                'duration' => $s['duration'],
                'description' => $s['description'],
                'takeaways' => $s['takeaways'] ?? [],
                'createdAt' => $s['createdAt'] ?? date('c'),
                'expiresAt' => $expiresAt,
                'isExpired' => $isExpired,
                'remainingSeconds' => $remainingSeconds,
                // Only provide the video embed URL if the 5-day window is currently active!
                'videoUrl' => $isExpired ? '' : $s['videoUrl']
            ];

            $safeSessions[] = $safeSession;
        }

        echo json_encode([
            'ok' => true,
            'member' => $foundMember,
            'sessions' => $safeSessions,
            'serverTimestamp' => $now
        ]);
        break;

    // 02. ADMIN VERIFICATION
    case 'admin_verify':
        $passcode = $input['passcode'] ?? '';
        if ($passcode !== ADMIN_PASSCODE) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Invalid admin passcode.']);
            exit;
        }
        echo json_encode(['ok' => true, 'message' => 'Admin verified.']);
        break;

    // 03. ADMIN FETCH ALL DATA
    case 'admin_get_data':
        $passcode = $input['passcode'] ?? '';
        if ($passcode !== ADMIN_PASSCODE) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Unauthorized.']);
            exit;
        }

        $db = loadData($dataFile);
        $now = time();

        // Calculate remaining seconds for admin view
        foreach ($db['sessions'] as &$s) {
            $expiresAt = isset($s['expiresAt']) ? (int)$s['expiresAt'] : (strtotime($s['createdAt'] ?? 'now') + (5 * 86400));
            $s['isExpired'] = ($now >= $expiresAt);
            $s['remainingSeconds'] = max(0, $expiresAt - $now);
        }

        echo json_encode([
            'ok' => true,
            'members' => $db['members'],
            'sessions' => $db['sessions'],
            'serverTimestamp' => $now
        ]);
        break;

    // 04. ADMIN ADD / REPLACE SESSION (5-day window)
    case 'add_session':
        $passcode = $input['passcode'] ?? '';
        if ($passcode !== ADMIN_PASSCODE) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Unauthorized.']);
            exit;
        }

        $title = trim($input['title'] ?? '');
        $videoUrl = trim($input['videoUrl'] ?? '');
        $date = trim($input['date'] ?? ('Week of ' . date('M j, Y')));
        $duration = trim($input['duration'] ?? '45 mins');
        $desc = trim($input['description'] ?? '');
        $takeaways = is_array($input['takeaways'] ?? null) ? $input['takeaways'] : [];
        $lifespanDays = max(1, (int)($input['lifespanDays'] ?? 5)); // Default 5 days
        $replaceOld = !empty($input['replaceOld']);

        if (empty($title) || empty($videoUrl)) {
            echo json_encode(['ok' => false, 'error' => 'Title and Video URL are required.']);
            exit;
        }

        // Clean up common video URLs to embed format
        $cleanUrl = $videoUrl;
        if (strpos($cleanUrl, 'watch?v=') !== false) {
            $cleanUrl = str_replace('watch?v=', 'embed/', $cleanUrl);
        } elseif (strpos($cleanUrl, 'youtu.be/') !== false) {
            $parts = explode('youtu.be/', $cleanUrl);
            $cleanUrl = 'https://www.youtube-nocookie.com/embed/' . end($parts);
        }

        $now = time();
        $newSession = [
            'id' => 'session-' . $now,
            'title' => $title,
            'date' => $date,
            'duration' => $duration,
            'videoUrl' => $cleanUrl,
            'description' => $desc,
            'takeaways' => $takeaways,
            'createdAt' => date('c', $now),
            'expiresAt' => $now + ($lifespanDays * 86400),
            'lifespanDays' => $lifespanDays
        ];

        $db = loadData($dataFile);

        if ($replaceOld) {
            // Replace previous sessions completely with this week's fresh session
            $db['sessions'] = [$newSession];
        } else {
            // Prepend new session
            array_unshift($db['sessions'], $newSession);
        }

        saveData($dataFile, $db);
        echo json_encode(['ok' => true, 'session' => $newSession, 'message' => 'Session published with 5-day expiration window!']);
        break;

    // 05. ADMIN DELETE SESSION
    case 'delete_session':
        $passcode = $input['passcode'] ?? '';
        if ($passcode !== ADMIN_PASSCODE) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Unauthorized.']);
            exit;
        }

        $id = $input['id'] ?? '';
        $db = loadData($dataFile);
        $db['sessions'] = array_values(array_filter($db['sessions'], fn($s) => $s['id'] !== $id));
        saveData($dataFile, $db);

        echo json_encode(['ok' => true, 'message' => 'Session deleted successfully.']);
        break;

    // 06. ADMIN ENROLL / RENEW STUDENT
    case 'enroll_student':
        $passcode = $input['passcode'] ?? '';
        if ($passcode !== ADMIN_PASSCODE) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Unauthorized.']);
            exit;
        }

        $email = strtolower(trim($input['email'] ?? ''));
        $name = trim($input['name'] ?? '');
        $days = max(1, (int)($input['days'] ?? 30));

        if (empty($email)) {
            echo json_encode(['ok' => false, 'error' => 'Valid student email is required.']);
            exit;
        }

        $db = loadData($dataFile);
        $today = date('Y-m-d');
        $expiry = addDaysDate($days);
        $found = false;

        foreach ($db['members'] as &$m) {
            if (strtolower(trim($m['email'])) === $email) {
                $m['expiryDate'] = $expiry;
                $m['status'] = 'active';
                if (!empty($name)) $m['name'] = $name;
                $found = true;
                break;
            }
        }

        if (!$found) {
            $db['members'][] = [
                'email' => $email,
                'name' => $name ?: 'DMJ Student',
                'enrolledDate' => $today,
                'expiryDate' => $expiry,
                'status' => 'active'
            ];
        }

        saveData($dataFile, $db);
        echo json_encode([
            'ok' => true,
            'message' => "Student {$email} successfully enrolled with access valid until {$expiry} ({$days} days)."
        ]);
        break;

    // 07. ADMIN EXTEND STUDENT (+30 DAYS)
    case 'extend_student':
        $passcode = $input['passcode'] ?? '';
        if ($passcode !== ADMIN_PASSCODE) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Unauthorized.']);
            exit;
        }

        $email = strtolower(trim($input['email'] ?? ''));
        $db = loadData($dataFile);
        $today = date('Y-m-d');
        $newExpiry = '';

        foreach ($db['members'] as &$m) {
            if (strtolower(trim($m['email'])) === $email) {
                $base = ($m['expiryDate'] > $today) ? $m['expiryDate'] : $today;
                $newExpiry = date('Y-m-d', strtotime($base . ' +30 days'));
                $m['expiryDate'] = $newExpiry;
                $m['status'] = 'active';
                break;
            }
        }

        saveData($dataFile, $db);
        echo json_encode(['ok' => true, 'newExpiry' => $newExpiry]);
        break;

    // 08. ADMIN DELETE STUDENT
    case 'delete_student':
        $passcode = $input['passcode'] ?? '';
        if ($passcode !== ADMIN_PASSCODE) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Unauthorized.']);
            exit;
        }

        $email = strtolower(trim($input['email'] ?? ''));
        $db = loadData($dataFile);
        $db['members'] = array_values(array_filter($db['members'], fn($m) => strtolower(trim($m['email'])) !== $email));
        saveData($dataFile, $db);

        echo json_encode(['ok' => true, 'message' => "Student {$email} removed."]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Unknown action.']);
        break;
}
