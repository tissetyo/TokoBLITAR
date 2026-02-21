import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
    },
})

export async function uploadToR2(
    key: string,
    file: Buffer,
    contentType: string,
): Promise<string> {
    await r2.send(
        new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
            Key: key,
            Body: file,
            ContentType: contentType,
        }),
    )
    return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`
}

export async function deleteFromR2(key: string): Promise<void> {
    await r2.send(
        new DeleteObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
            Key: key,
        }),
    )
}

export async function getPresignedUploadUrl(
    key: string,
    contentType: string,
): Promise<string> {
    return getSignedUrl(
        r2,
        new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
            Key: key,
            ContentType: contentType,
        }),
        { expiresIn: 3600 },
    )
}
