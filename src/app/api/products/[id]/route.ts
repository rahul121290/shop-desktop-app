// app/api/products/[id]/route.ts - NEXT.JS 15 COMPATIBLE
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ ASYNC PARAMS
) {
  try {
    const { id } = await params;  // ✅ AWAIT PARAMS
    const body = await request.json();
    
    const client = await clientPromise;
    const db = client.db('shopdb');
    
    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(id) },  // ✅ USE AWAITED ID
      { $set: body }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ ASYNC PARAMS
) {
  try {
    const { id } = await params;  // ✅ AWAIT PARAMS
    const client = await clientPromise;
    const db = client.db('shopdb');
    
    const result = await db.collection('products').deleteOne(
      { _id: new ObjectId(id) }    // ✅ USE AWAITED ID
    );
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
