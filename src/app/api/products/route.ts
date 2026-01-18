import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('shopdb');
    const products = await db.collection('products').find({}).toArray();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('shopdb');
    
    const result = await db.collection('products').insertOne(body);
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId 
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
