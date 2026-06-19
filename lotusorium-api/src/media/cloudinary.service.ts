import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

/**
 * Thin wrapper over the Cloudinary SDK. Stays dormant until CLOUDINARY_* env
 * vars are set: any operation throws 503 with a clear message when unconfigured.
 *
 * Uploads are done browser -> Cloudinary directly using a short-lived signed
 * payload from `signUpload()`, keeping large files off our server.
 */
@Injectable()
export class CloudinaryService {
  constructor(private readonly config: ConfigService) {}

  private creds() {
    return {
      cloudName: this.config.get<string>('cloudinary.cloudName'),
      apiKey: this.config.get<string>('cloudinary.apiKey'),
      apiSecret: this.config.get<string>('cloudinary.apiSecret'),
    };
  }

  isConfigured(): boolean {
    const { cloudName, apiKey, apiSecret } = this.creds();
    return Boolean(cloudName && apiKey && apiSecret);
  }

  private requireCreds() {
    const creds = this.creds();
    if (!creds.cloudName || !creds.apiKey || !creds.apiSecret) {
      throw new ServiceUnavailableException(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
      );
    }
    return creds as { cloudName: string; apiKey: string; apiSecret: string };
  }

  /** Produces signed params the browser uses to upload directly to Cloudinary. */
  signUpload(folder = 'lotusorium/products'): UploadSignature {
    const { cloudName, apiKey, apiSecret } = this.requireCreds();
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      apiSecret,
    );
    return { cloudName, apiKey, timestamp, folder, signature };
  }

  /** Permanently deletes an asset by its Cloudinary public_id. */
  async destroy(publicId: string): Promise<void> {
    const { cloudName, apiKey, apiSecret } = this.requireCreds();
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    await cloudinary.uploader.destroy(publicId);
  }
}
