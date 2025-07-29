import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data'; // ✅ Needed manually

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const form = new FormData();
    form.append('upload', buffer, {
      filename: 'plate.jpg',
      contentType: image.type,
    });

    const response = await axios.post(
      'https://api.platerecognizer.com/v1/plate-reader/',
      form,
      {
        headers: {
          Authorization: `Token ${process.env.PLATE_RECOGNIZER_TOKEN}`,
          ...form.getHeaders(),
        },
      }
    );

    return NextResponse.json({ plate: response.data.results });
  } catch (error: any) {
    console.error('Plate Reader API error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
