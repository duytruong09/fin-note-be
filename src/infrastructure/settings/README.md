# SettingsService

Global settings management for Fin-Note application.

## Overview

The `SettingsService` provides a centralized way to manage app-wide configuration stored in the database. This allows dynamic configuration changes without restarting the application.

## Usage

### Inject Service

```typescript
import { SettingsService } from '@/infrastructure/settings/settings.service';

@Injectable()
export class YourService {
  constructor(private readonly settingsService: SettingsService) {}
}
```

### Get Setting

```typescript
// Get setting (returns null if not found)
const token = await this.settingsService.get('telegram_bot_token');

// Get setting (throws if not found)
const token = await this.settingsService.getOrThrow('telegram_bot_token');
```

### Set Setting

```typescript
await this.settingsService.set('feature_enabled', 'true', {
  description: 'Enable new feature',
  isSecret: false,
  isPublic: true, // Available to mobile app
});
```

### Check if Setting Exists

```typescript
const exists = await this.settingsService.has('some_key');
```

### Get Public Settings (for Mobile App)

```typescript
// Returns only settings with isPublic: true
const publicSettings = await this.settingsService.getPublicSettings();
// { "app_version": "1.0.0", "feature_voice_enabled": "true" }
```

### Get All Settings (Admin)

```typescript
// Get all non-secret settings
const settings = await this.settingsService.getAll();

// Get all settings including secrets (admin only)
const allSettings = await this.settingsService.getAll(true);
```

## Default Settings

Default settings are seeded in `prisma/seed.ts`:

| Key | Description | Secret | Public |
|-----|-------------|--------|--------|
| `telegram_bot_token` | Telegram Bot API token | ✅ | ❌ |
| `telegram_enabled` | Enable Telegram bot | ❌ | ❌ |
| `feature_voice_enabled` | Enable voice input | ❌ | ✅ |
| `app_version` | Current app version | ❌ | ✅ |

## Adding New Settings

### 1. Via Seed

Edit `prisma/seed.ts`:

```typescript
const defaultSettings = [
  // ... existing settings
  {
    key: 'new_feature_flag',
    value: 'false',
    description: 'Enable new feature',
    isSecret: false,
    isPublic: true,
  },
];
```

### 2. Via Code

```typescript
await settingsService.set('new_feature_flag', 'false', {
  description: 'Enable new feature',
  isSecret: false,
  isPublic: true,
});
```

### 3. Via Database

```sql
INSERT INTO settings (id, key, value, description, is_secret, is_public, created_at, updated_at)
VALUES (gen_random_uuid(), 'new_feature_flag', 'false', 'Enable new feature', false, true, NOW(), NOW());
```

## Caching

Settings are cached in memory for performance. The cache is automatically updated when you use `set()` or `delete()`.

To manually clear cache:

```typescript
settingsService.clearCache();
```

## Security

- **Secret Settings** (`isSecret: true`): Not exposed in `getAll()` unless explicitly requested
- **Public Settings** (`isPublic: true`): Safe to expose to mobile app via API
- Examples:
  - `telegram_bot_token`: Secret, not public
  - `app_version`: Not secret, public
  - `feature_voice_enabled`: Not secret, public

## Best Practices

1. **Use descriptive keys**: `feature_voice_enabled` instead of `voice`
2. **Mark secrets properly**: API tokens, passwords should have `isSecret: true`
3. **Use public flag wisely**: Only expose settings that mobile app needs
4. **Store as strings**: All values are strings, parse as needed
5. **Document in seed**: Add all default settings to seed file

## Examples

### Feature Flags

```typescript
// Check if feature enabled
const isEnabled = await settingsService.get('feature_voice_enabled');
if (isEnabled === 'true') {
  // Enable voice feature
}
```

### Dynamic Configuration

```typescript
// Get max file size
const maxSize = await settingsService.get('max_upload_size_mb');
const maxSizeNum = parseInt(maxSize || '10', 10);
```

### App Versioning

```typescript
// Get current version
const version = await settingsService.get('app_version');
```
