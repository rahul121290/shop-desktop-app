import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('shopdb');
    const customers = await db.collection('users').find({}).toArray();
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
