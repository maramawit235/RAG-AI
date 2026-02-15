import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabaseClient';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id,title,file_name,created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('documents list error', error);
      return NextResponse.json({ error: 'Failed to list documents' }, { status: 500 });
    }

    return NextResponse.json({ documents: data || [] });
  } catch (err) {
    console.error('documents list exception', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
