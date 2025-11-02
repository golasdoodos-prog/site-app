import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from './auth';

export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUser(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return user;
}

export async function requireRole(request: NextRequest, allowedRoles: string[]) {
  const user = await requireAuth(request);
  
  if (user instanceof NextResponse) {
    return user;
  }
  
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  return user;
}

