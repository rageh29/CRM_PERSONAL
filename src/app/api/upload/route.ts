import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول' }, { status: 401 });
    }

    const { image, folder } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'لم يتم تزويد الصورة' }, { status: 400 });
    }

    // Upload image to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: folder || 'error_app_logos',
      resource_type: 'auto',
      transformation: [
        { width: 400, height: 400, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
      ]
    });

    return NextResponse.json({
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
    });
  } catch (error: any) {
    console.error('Cloudinary Upload Error:', error);
    return NextResponse.json(
      { error: error?.message || 'فشل رفع الصورة إلى Cloudinary' },
      { status: 500 }
    );
  }
}
