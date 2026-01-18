import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('shopdb');
    const items = await db.collection('products').find({}).toArray(); // ✅ Your collection name
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}
