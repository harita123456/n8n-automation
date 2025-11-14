import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    // Get encryption key from environment or use a default (not recommended for production)
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error(
        'ENCRYPTION_KEY environment variable is required for encrypting sensitive data',
      );
    }
    // Convert the key to a 32-byte buffer (required for AES-256)
    this.key = crypto.scryptSync(encryptionKey, 'salt', 32);
  }

  /**
   * Encrypt a string value
   */
  encrypt(text: string): string {
    if (!text) return text;

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine iv, authTag, and encrypted data
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt an encrypted string
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;

    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        // If it doesn't have the expected format, assume it's not encrypted (for backward compatibility)
        return encryptedText;
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      // If decryption fails, assume it's not encrypted (for backward compatibility)
      return encryptedText;
    }
  }
}
