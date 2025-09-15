import { randomBytes } from "crypto";

// Granular CRUD permissions
export type CrudOperation = "create" | "read" | "update" | "delete";
export type ResourceType = "endpoints" | "messages";

export type ApiKeyPermission = 
    | `endpoints:${CrudOperation}`
    | `messages:${CrudOperation}`
    | "all_permissions";

export interface ApiKeyData {
    id: string;
    environment: string,
    name: string;
    key: string;
    userId: string;
    permissions: ApiKeyPermission[];
    enabled: boolean;
    createdAt: Date;
    lastUsed?: Date;
}

/**
 * Generate a secure API key with prefix
 */
export function generateApiKey(): string {
    // Generate a random 32-byte key and encode as hex
    const randomPart = randomBytes(32).toString("hex");
    // Add a prefix to identify the key type
    const prefix = `wh_`;
    return `${prefix}${randomPart}`;
}

/**
 * Generate a unique API key ID
 */
export function generateApiKeyId(): string {
    return randomBytes(16).toString("hex");
}

/**
 * Parse permissions from string (for database storage)
 */
export function parsePermissions(permissionsString: string): ApiKeyPermission[] {
    try {
        return JSON.parse(permissionsString) as ApiKeyPermission[];
    } catch {
        return [];
    }
}

/**
 * Serialize permissions to string (for database storage)
 */
export function serializePermissions(permissions: ApiKeyPermission[]): string {
    return JSON.stringify(permissions);
}

/**
 * Check if a permission set includes a specific permission
 */
export function hasPermission(
    userPermissions: ApiKeyPermission[], 
    requiredPermission: ApiKeyPermission
): boolean {
    return userPermissions.includes("all_permissions") || userPermissions.includes(requiredPermission);
}

/**
 * Check if user has permission for a specific resource and operation
 */
export function hasResourcePermission(
    userPermissions: ApiKeyPermission[],
    resource: ResourceType,
    operation: CrudOperation
): boolean {
    if (userPermissions.includes("all_permissions")) {
        return true;
    }
    
    const specificPermission = `${resource}:${operation}` as ApiKeyPermission;
    return userPermissions.includes(specificPermission);
}

/**
 * Get all available permissions
 */
export function getAllPermissions(): ApiKeyPermission[] {
    const permissions: ApiKeyPermission[] = [];
    
    // Add granular CRUD permissions
    const resources: ResourceType[] = ["endpoints", "messages"];
    const operations: CrudOperation[] = ["create", "read", "update", "delete"];
    
    for (const resource of resources) {
        for (const operation of operations) {
            permissions.push(`${resource}:${operation}` as ApiKeyPermission);
        }
    }
    
    // Add all permissions
    permissions.push("all_permissions");
    
    return permissions;
}

/**
 * Get permission display name
 */
export function getPermissionDisplayName(permission: ApiKeyPermission): string {
    if (permission === "all_permissions") {
        return "All Permissions";
    }
    
    const [resource, operation] = permission.split(":");
    const resourceName = resource === "endpoints" ? "Endpoints" : "Messages";
    const operationName = operation.charAt(0).toUpperCase() + operation.slice(1);
    
    return `${resourceName} - ${operationName}`;
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
    return key.startsWith("wh_") && key.length === 67; // wh_ + 64 hex chars
}

/**
 * Create default permissions for new users
 */
export function getDefaultPermissions(): ApiKeyPermission[] {
    return ["all_permissions"];
}

/**
 * Get common permission sets for quick selection
 */
export function getPermissionPresets(): Record<string, ApiKeyPermission[]> {
    return {
        "Full Access": ["all_permissions"],
        "Read Only": [
            "endpoints:read",
            "messages:read"
        ],
        "Endpoints Only": [
            "endpoints:create",
            "endpoints:read", 
            "endpoints:update",
            "endpoints:delete"
        ],
        "Messages Only": [
            "messages:create",
            "messages:read",
            "messages:update", 
            "messages:delete"
        ],
        "Create & Read": [
            "endpoints:create",
            "endpoints:read",
            "messages:create",
            "messages:read"
        ]
    };
}

/**
 * Mask API key for display (show first 8 and last 8 characters)
 */
export function maskApiKey(key: string | undefined | null): string {
    if (!key) return "No key available";
    if (key.length <= 16) return key;
    return `${key.substring(0, 8)}...${key.substring(key.length - 8)}`;
}
